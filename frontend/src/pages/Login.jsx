import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/UI/Button'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function Login() {
  const { login, changePassword, user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [mustChange, setMustChange] = useState(false)

  useEffect(() => {
    if (user?.must_change_password) setMustChange(true)
  }, [user])
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.must_change_password) {
        setMustChange(true)
      } else {
        const perms = data.permissions || []
        if (perms.length === 1 && perms[0] === 'visao_geral') {
          navigate('/visao-geral')
        } else {
          navigate('/dashboard')
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPass !== confirmPass) {
      setError('As senhas não coincidem')
      return
    }
    setLoading(true)
    setError('')
    try {
      await changePassword(password, newPass)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-liax-primary-dark via-liax-primary-deeper to-liax-text-dark">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-40 mx-auto mb-4">
            <img src="/brand/liax-logo.png" alt="Liax Dashboard" className="w-full h-auto object-contain drop-shadow-lg" />
          </div>
          <h1 className="text-white font-heading font-bold text-2xl">Liax Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Plataforma de Métricas ClickUp</p>
        </div>

        <div className="bg-white rounded-3xl shadow-liax-card p-8">
          {!mustChange ? (
            <>
              <h2 className="font-heading font-bold text-liax-text-dark text-xl mb-6">Entrar</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-liax-neutral mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="liax-input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="liax-input pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-liax-neutral"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-liax-error text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
                <Button type="submit" loading={loading} className="w-full justify-center">
                  <LogIn size={16} />
                  Entrar
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-heading font-bold text-liax-text-dark text-xl mb-2">Alterar Senha</h2>
              <p className="text-liax-neutral text-sm mb-6">Este é seu primeiro acesso. Defina uma nova senha.</p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Nova Senha</label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="liax-input"
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-liax-neutral mb-1.5">Confirmar Senha</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="liax-input"
                    placeholder="Repita a senha"
                    required
                  />
                </div>
                {error && <p className="text-liax-error text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}
                <Button type="submit" loading={loading} className="w-full justify-center">
                  Salvar Senha
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
