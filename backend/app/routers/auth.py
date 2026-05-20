from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import LoginRequest, ChangePasswordRequest, TokenResponse
from ..utils.security import verify_password, hash_password, create_access_token
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário desativado")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        must_change_password=user.must_change_password,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.name,
        role_id=user.role_id,
        permissions=user.role.permissions or [],
    )


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    current_user.password_hash = hash_password(payload.new_password)
    current_user.must_change_password = False
    db.commit()
    return {"message": "Senha alterada com sucesso"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.name,
        "role_id": current_user.role_id,
        "permissions": current_user.role.permissions or [],
        "must_change_password": current_user.must_change_password,
    }
