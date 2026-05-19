#!/usr/bin/env python3
"""
Script para gerar 5 PDFs com artigos aleatórios de assuntos diversos.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
import random

# Configurações
OUTPUT_DIR = "d:/ProjetosLiax/BuscadorStatusClickup"
MIN_PAGES = 10

# Artigos com conteúdo expandido para atender requisitos do Scribd (mínimo 2700 caracteres)
articles = [
    {
        "title": "O Impacto da Inteligência Artificial na Educação Moderna",
        "filename": "impacto_ia_educacao.pdf",
        "content": """
A inteligência artificial (IA) tem revolucionado diversos setores da sociedade, e a educação não é exceção. Nos últimos anos, temos testemunhado uma transformação significativa na forma como o conhecimento é transmitido e assimilado, graças às tecnologias baseadas em IA. Esta revolução não é apenas tecnológica, mas também pedagógica e social, afetando profundamente a relação entre professores e alunos.

Sistemas de aprendizado adaptativo permitem que os estudantes tenham experiências personalizadas, onde o conteúdo é ajustado automaticamente de acordo com seu ritmo e nível de compreensão. Tutores virtuais inteligentes estão disponíveis 24 horas por dia, oferecendo suporte personalizado e feedback imediato. Esses sistemas utilizam algoritmos avançados de machine learning para identificar padrões de aprendizado e adaptar o material didático em tempo real.

Além disso, a IA está facilitando a análise de dados educacionais em escala, permitindo que instituições identifiquem padrões de aprendizado e implementem intervenções mais eficazes. Professores podem utilizar ferramentas automatizadas para correção de provas e criação de materiais didáticos, liberando tempo para interações mais significativas com os alunos. A análise preditiva permite identificar estudantes em risco de reprovação antes que isso aconteça, possibilitando intervenções preventivas.

No entanto, é importante considerar os desafios éticos e práticos dessa transformação. Questões sobre privacidade de dados, viés algorítmico e a necessidade de manter o elemento humano no processo educacional são temas que merecem atenção cuidadosa. A coleta massiva de dados sobre estudantes levanta preocupações sobre privacidade e o uso dessas informações. Além disso, algoritmos podem perpetuar vieses existentes se não forem devidamente calibrados e monitorados.

O futuro da educação com IA promete ser mais acessível, personalizado e eficiente, mas exige uma abordagem equilibrada que combine tecnologia com pedagogia sólida. A formação de professores precisa evoluir para incluir competências digitais e compreensão de como utilizar essas ferramentas de forma eficaz. Políticas públicas precisam ser desenvolvidas para garantir que o acesso a essas tecnologias seja equitativo e não aumente as desigualdades educacionais existentes.

A implementação de IA na educação também traz desafios técnicos e financeiros. Muitas instituições, especialmente em países em desenvolvimento, podem não ter recursos para implementar sistemas avançados de IA. Além disso, a dependência excessiva de tecnologia pode reduzir a interação humana, que é fundamental para o desenvolvimento social e emocional dos estudantes.

É crucial que a integração da IA na educação seja feita de forma consciente e planejada, considerando não apenas os benefícios tecnológicos, mas também as implicações pedagógicas, éticas e sociais. A colaboração entre educadores, desenvolvedores de tecnologia, policymakers e pesquisadores é essencial para criar soluções que realmente melhorem o aprendizado e sejam acessíveis a todos.

A pesquisa contínua sobre o impacto da IA na educação é fundamental para entender melhor como essas tecnologias afetam diferentes aspectos do processo de aprendizagem. Estudos longitudinais são necessários para avaliar os efeitos a longo prazo do uso de IA no desenvolvimento cognitivo e social dos estudantes.

Em resumo, a IA tem o potencial de transformar positivamente a educação, mas sua implementação deve ser cuidadosa, ética e focada nos melhores interesses dos estudantes e da sociedade como um todo.
        """
    },
    {
        "title": "Sustentabilidade Urbana: Desafios e Soluções para Cidades Inteligentes",
        "filename": "sustentabilidade_urbana.pdf",
        "content": """
O crescimento populacional urbano apresenta desafios sem precedentes para a sustentabilidade ambiental. Cidades ao redor do mundo enfrentam problemas como poluição, congestionamento, consumo excessivo de energia e gestão ineficiente de resíduos. À medida que mais pessoas migram para áreas urbanas em busca de oportunidades econômicas, a pressão sobre os recursos urbanos aumenta dramaticamente.

O conceito de cidades inteligentes oferece uma abordagem integrada para esses desafios, utilizando tecnologia e dados para otimizar o uso de recursos urbanos. Sensores IoT monitoram qualidade do ar, tráfego e consumo de energia em tempo real, permitindo respostas rápidas e eficientes. Esses sensores são distribuídos por toda a cidade, criando uma rede de coleta de dados que permite uma visão abrangente do funcionamento urbano.

Transporte público inteligente, redes elétricas distribuídas e sistemas de gestão de resíduos automatizados são exemplos de soluções que já estão sendo implementadas em diversas metrópoles. Essas iniciativas não apenas melhoram a qualidade de vida dos habitantes, mas também reduzem significativamente a pegada ambiental das cidades. O transporte inteligente inclui sistemas de gestão de tráfego em tempo real, veículos autônomos e integração perfeita entre diferentes modos de transporte.

A participação cidadã é fundamental para o sucesso dessas iniciativas. Plataformas digitais permitem que os moradores contribuam com dados e feedback, criando um ecossistema colaborativo de gestão urbana. Aplicativos móveis permitem que os cidadãos reportem problemas como buracos nas ruas, iluminação defeituosa ou problemas de coleta de lixo, facilitando a manutenção urbana.

Investimentos em infraestrutura verde, como parques urbanos e telhados verdes, complementam as soluções tecnológicas, proporcionando benefícios ambientais e sociais adicionais. Espaços verdes urbanos ajudam a reduzir o efeito de ilha de calor, melhorar a qualidade do ar e proporcionar áreas de lazer para a população. Telhados verdes isolam edifícios, reduzindo o consumo de energia para climatização.

A gestão da água é outro aspecto crucial da sustentabilidade urbana. Sistemas inteligentes de detecção de vazamentos, coleta de água da chuva e reúso de água cinza podem reduzir significativamente o consumo de água potável. Além disso, tecnologias de tratamento de água avançadas podem permitir o reúso de água para fins não potáveis, como irrigação e descarga de sanitários.

A energia renovável desempenha um papel central nas cidades sustentáveis. Painéis solares em edifícios, turbinas eólicas urbanas e sistemas de armazenamento de energia podem tornar as cidades mais autossuficientes energeticamente. Redes inteligentes (smart grids) permitem a distribuição eficiente de energia, balanceando oferta e demanda em tempo real.

No entanto, a implementação de cidades inteligentes enfrenta desafios significativos. O custo inicial da infraestrutura tecnológica pode ser proibitivo para muitas cidades, especialmente em países em desenvolvimento. Além disso, questões de privacidade e segurança de dados precisam ser cuidadosamente endereçadas para proteger os direitos dos cidadãos.

A inclusão digital é outro desafio importante. Para que os benefícios das cidades inteligentes sejam acessíveis a todos, é necessário garantir que todos os cidadãos tenham acesso às tecnologias e competências digitais necessárias para participar plenamente da vida urbana digital.

A governança colaborativa é essencial para o sucesso das iniciativas de cidades inteligentes. Parcerias entre setor público, setor privado, academia e sociedade civil podem garantir que as soluções desenvolvidas atendam às reais necessidades da população e sejam sustentáveis a longo prazo.

Em resumo, as cidades inteligentes representam uma abordagem promissora para os desafios da urbanização, mas sua implementação deve ser cuidadosa, inclusiva e focada no bem-estar de todos os cidadãos.
        """
    },
    {
        "title": "A Evolução do Comércio Eletrônico e o Futuro do Varejo",
        "filename": "evolucao_comercio_eletronico.pdf",
        "content": """
O comércio eletrônico passou por uma transformação dramática nas últimas décadas, evoluindo de uma curiosidade tecnológica para um componente essencial da economia global. A pandemia de COVID-19 acelerou ainda mais essa tendência, forçando empresas e consumidores a adotarem rapidamente canais digitais. O que antes era uma opção complementar tornou-se uma necessidade para a sobrevivência de muitos negócios.

Tecnologias como realidade aumentada e virtual estão redefinindo a experiência de compra online, permitindo que os consumidores visualizem produtos de forma imersiva antes da compra. Inteligência artificial e análise de big data permitem personalização extrema, recomendando produtos com base no comportamento e preferências individuais. Chatbots e assistentes virtuais oferecem suporte ao cliente 24 horas por dia, melhorando significativamente a experiência de compra.

O conceito de comércio unificado (omnichannel) tornou-se essencial, integrando perfeitamente experiências online e offline. Lojas físicas agora funcionam como centros de experiência e fulfillment, enquanto canais digitais oferecem conveniência e acessibilidade. Os consumidores podem comprar online e retirar na loja, ou experimentar produtos na loja e finalizar a compra online, criando uma experiência fluida entre os canais.

Logística e cadeia de suprimentos também foram revolucionadas, com automação de armazéns, drones de entrega e otimização de rotas baseada em IA. Essas inovações reduzem custos e melhoram significativamente os tempos de entrega. A tecnologia blockchain está sendo utilizada para rastrear produtos através da cadeia de suprimentos, garantindo transparência e autenticidade.

O futuro do varejo será híbrido, combinando a eficiência digital com a experiência humana, criando ecossistemas de compra fluidos e personalizados. As lojas físicas continuarão existindo, mas seu papel evoluirá de meros pontos de venda para centros de experiência, onde os consumidores podem interagir com produtos e marcas de formas significativas.

A personalização será ainda mais sofisticada, com IA analisando não apenas o histórico de compras, mas também dados de navegação, redes sociais e contexto situacional para oferecer recomendações hiperpersonalizadas. A realidade aumentada permitirá que os consumidores "experimentem" produtos virtualmente, desde roupas a móveis, antes de comprar.

O comércio social continuará crescendo, com influenciadores e criadores de conteúdo desempenhando papéis cada vez mais importantes no processo de decisão de compra. Plataformas de mídia social integrarão funcionalidades de compra, permitindo transações diretas sem sair do aplicativo.

A sustentabilidade se tornará um fator competitivo importante, com consumidores cada vez mais conscientes do impacto ambiental de suas compras. Empresas que adotarem práticas sustentáveis, desde o uso de materiais recicláveis até logística de baixo carbono, terão vantagem competitiva.

Moedas digitais e pagamentos criptográficos podem transformar ainda mais o comércio eletrônico, oferecendo novas formas de pagamento que são mais rápidas, seguras e globais. A tecnologia blockchain também pode facilitar pagamentos internacionais com menores taxas e maior transparência.

No entanto, o crescimento do comércio eletrônico também traz desafios. A concorrência global intensifica a pressão sobre os preços, enquanto os custos de aquisição de clientes continuam aumentando. A necessidade de proteger dados dos consumidores e prevenir fraudes exige investimentos contínuos em segurança cibernética.

A regulação do comércio eletrônico continuará evoluindo, com governos implementando novas regras sobre proteção de dados, tributação de vendas online e responsabilidade de plataformas. As empresas precisarão se adaptar rapidamente a esse ambiente regulatório em constante mudança.

Em resumo, o futuro do comércio eletrônico será caracterizado por inovação contínua, personalização extrema e integração perfeita entre canais, mas também exigirá que as empresas sejam socialmente responsáveis e adaptáveis às mudanças regulatórias.
        """
    },
    {
        "title": "Bem-Estar Mental no Ambiente de Trabalho: Estratégias Empresariais",
        "filename": "bem_estar_mental_trabalho.pdf",
        "content": """
A saúde mental no ambiente de trabalho tornou-se uma prioridade crítica para organizações modernas. Estudos mostram que investimentos em bem-estar mental dos colaboradores resultam em aumento de produtividade, redução de absenteísmo e melhoria do clima organizacional. O custo do estresse relacionado ao trabalho é estimado em centenas de bilhões de dólares anualmente em todo o mundo, tornando o bem-estar mental não apenas uma questão ética, mas também econômica.

Empresas estão implementando programas abrangentes que incluem acesso a serviços de aconselhamento, iniciativas de mindfulness e treinamento de gestão de estresse. Políticas de trabalho flexível, incluindo opções de trabalho remoto e horários adaptáveis, demonstram compromisso com o equilíbrio entre vida pessoal e profissional. Essas iniciativas reconhecem que os colaboradores são pessoas completas, não apenas recursos produtivos.

A cultura organizacional desempenha um papel fundamental. Lideranças que promovem abertura sobre questões de saúde mental e combatem o estigma associado criam ambientes onde os colaboradores se sentem seguros para buscar ajuda quando necessário. A comunicação honesta e transparente sobre saúde mental no trabalho ajuda a normalizar o diálogo e reduzir o estigma.

Programas de prevenção focados em identificação precoce de sinais de burnout e estresse crônico são essenciais. Treinamento para gerentes sobre como reconhecer e responder a sinais de dificuldade mental em suas equipes pode fazer uma diferença significativa. A capacitação de líderes para ter conversas difíceis sobre saúde mental é um componente crucial de qualquer programa de bem-estar.

O retorno sobre investimento em iniciativas de bem-estar mental é claro: colaboradores saudáveis e engajados são mais produtivos, criativos e leais à organização. Estudos mostram que para cada dólar investido em saúde mental, as empresas obtêm um retorno de 4 a 6 dólares em produtividade e economia de custos.

O design do ambiente de trabalho também impacta significativamente a saúde mental. Espaços que promovem colaboração, mas também oferecem áreas de quietude e privacidade, contribuem para um ambiente mais saudável. A iluminação natural, plantas e áreas de descanso podem reduzir o estresse e melhorar o bem-estar geral.

A carga de trabalho e as expectativas irreais são fatores significativos de estresse no trabalho. Organizações precisam revisar continuamente seus processos e práticas para garantir que as metas sejam realistas e alcançáveis. A delegação eficaz e o empoderamento dos colaboradores também podem reduzir o estresse e aumentar o senso de controle.

A conexão social no trabalho é outro fator importante. Programas de mentoria, equipes multifuncionais e atividades de team building podem fortalecer os relacionamentos entre colegas, criando uma rede de apoio natural. O isolamento social no trabalho, especialmente em ambientes remotos, pode ser mitigado através de iniciativas intencionais de conexão.

A tecnologia também pode ser tanto uma solução quanto um problema. Enquanto ferramentas de colaboração digital podem facilitar o trabalho remoto, a sobrecarga de informações e a expectativa de disponibilidade constante podem contribuir para o estresse. Políticas claras sobre o uso de tecnologia e desconexão são essenciais.

A diversidade e inclusão também estão intimamente ligadas ao bem-estar mental. Ambientes onde todos os colaboradores se sentem valorizados e respeitados tendem a ter melhores indicadores de saúde mental. O combate ao assédio, discriminação e microagressões é fundamental para criar um ambiente psicologicamente seguro.

A medição e avaliação contínua dos programas de bem-estar mental são essenciais para garantir sua eficácia. Pesquisas de clima, feedback dos colaboradores e métricas de saúde mental podem ajudar as organizações a identificar áreas de melhoria e ajustar suas estratégias conforme necessário.

Em resumo, o bem-estar mental no trabalho não é um benefício opcional, mas uma necessidade estratégica para organizações que desejam ser sustentáveis e competitivas a longo prazo.
        """
    },
    {
        "title": "A Revolução da Biomedicina: Terapias Gênicas e Medicina Personalizada",
        "filename": "revolucao_biomedicina.pdf",
        "content": """
A biomedicina está passando por uma revolução transformadora com o advento de terapias gênicas e medicina personalizada. Tecnologias como CRISPR-Cas9 permitiram edições precisas do genoma humano, abrindo possibilidades inéditas para tratamento de doenças genéticas. Esta revolução representa uma mudança fundamental na forma como entendemos e tratamos doenças, movendo-se de uma abordagem baseada em sintomas para uma baseada em causa molecular.

Terapias gênicas já estão sendo utilizadas com sucesso no tratamento de condições como distrofia muscular, anemia falciforme e certos tipos de câncer. Essas abordagens representam mudanças paradigmáticas, tratando a causa raiz das doenças em vez de apenas gerenciar sintomas. A terapia gênica funciona introduzindo, removendo ou alterando material genético nas células de um paciente, corrigindo defeitos genéticos que causam doenças.

A medicina personalizada utiliza informações genéticas individuais para personalizar tratamentos e prevenção. Farmacogenômica permite que médicos prescrevam medicamentos com base no perfil genético do paciente, maximizando eficácia e minimizando efeitos colaterais. Isso representa um afastamento do modelo "tamanho único" de medicina, onde todos os pacientes com a mesma condição recebem o mesmo tratamento.

Inteligência artificial está acelerando a descoberta de novos tratamentos, analisando vastas quantidades de dados genômicos e clínicos para identificar padrões e alvos terapêuticos que seriam impossíveis de detectar manualmente. Algoritmos de machine learning podem prever como diferentes pacientes responderão a tratamentos específicos, permitindo personalização ainda maior da terapia.

A biologia sintética está emergindo como uma nova fronteira, permitindo que cientistas projetem e construam sistemas biológicos artificiais para aplicações médicas. Isso inclui a criação de células modificadas geneticamente para produzir medicamentos terapêuticos ou detectar doenças precocemente.

A medicina regenerativa está avançando rapidamente, com pesquisas em células-tronco e engenharia de tecidos oferecendo novas esperanças para pacientes com condições degenerativas. A possibilidade de regenerar tecidos danificados ou até mesmo órgãos inteiros poderia transformar o tratamento de muitas doenças crônicas.

No entanto, essas tecnologias também levantam importantes questões éticas sobre acesso, custo e implicações de longo prazo da edição genética. A sociedade precisa desenvolver frameworks regulatórios que equilibrem inovação com responsabilidade ética. O custo desses tratamentos é frequentemente proibitivo, criando desigualdades no acesso a terapias salvadoras.

A questão da edição de linhagem germinativa, que afetaria gerações futuras, é particularmente controversa e exige um debate público amplo e informado. As implicações sociais e éticas de alterar permanentemente o genoma humano são profundas e exigem consideração cuidadosa.

A privacidade dos dados genéticos é outra preocupação importante. À medida que mais informações genéticas são coletadas e armazenadas, há riscos significativos de discriminação e uso indevido desses dados. Leis robustas de proteção de dados genéticos são essenciais para proteger os direitos dos pacientes.

A educação pública sobre genética e medicina personalizada é crucial para que as pessoas possam tomar decisões informadas sobre seu próprio cuidado de saúde. A alfabetização genética deve ser uma parte da educação básica, preparando as gerações futuras para navegar este novo panorama médico.

A colaboração internacional é essencial para enfrentar os desafios éticos e práticos dessas tecnologias. Padrões globais para pesquisa e aplicação de terapias gênicas podem ajudar a garantir que o progresso científico beneficie a humanidade como um todo, não apenas aqueles que podem pagar.

Em resumo, a revolução da biomedicina oferece possibilidades extraordinárias para melhorar a saúde humana, mas exige uma abordagem cuidadosa que considere as implicações éticas, sociais e econômicas dessas poderosas tecnologias.
        """
    },
    {
        "title": "A Transformação da Indústria Automotiva: Veículos Elétricos e o Futuro da Mobilidade",
        "filename": "transformacao_industria_automotiva.pdf",
        "content": """
A indústria automotiva está passando por uma transformação radical sem precedentes, impulsionada pela transição para veículos elétricos e pela necessidade de reduzir emissões de carbono. Esta mudança representa não apenas uma evolução tecnológica, mas uma reestruturação completa de um setor que define a mobilidade moderna há mais de um século.

Os veículos elétricos (VEs) deixaram de ser uma curiosidade para se tornarem uma alternativa viável e cada vez mais popular aos veículos tradicionais movidos a combustíveis fósseis. Melhorias significativas na tecnologia de baterias, especialmente nas baterias de íon-lítio, aumentaram a autonomia dos VEs e reduziram os tempos de carregamento, abordando duas das principais barreiras para a adoção massiva.

A infraestrutura de carregamento está se expandindo rapidamente em todo o mundo, com governos e empresas privadas investindo pesadamente em redes de carregamento público. Esta expansão é crucial para reduzir a ansiedade de autonomia dos consumidores e tornar os VEs uma opção prática para viagens mais longas.

Os fabricantes de automóveis tradicionais estão investindo bilhões em pesquisa e desenvolvimento de tecnologias elétricas, reconhecendo que a transição é inevitável. Marcas icônicas que antes resistiam à eletrificação agora estão lançando linhas completas de veículos elétricos, comprometendo-se com datas específicas para eliminar gradualmente a produção de veículos a combustão.

A autonomia dos veículos é outra área de inovação rápida. Carros autônomos, impulsionados por inteligência artificial e sensores avançados, prometem revolucionar não apenas como dirigimos, mas também como concebemos o transporte e a propriedade de veículos. A combinação de veículos elétricos e autônomos pode transformar completamente o paradigma de mobilidade urbana.

A economia compartilhada de mobilidade está crescendo em paralelo com a eletrificação. Serviços de carona, compartilhamento de carros e transporte sob demanda estão se tornando mais populares, especialmente em áreas urbanas onde a propriedade de um veículo pessoal é menos prática. A eletrificação dessas frotas compartilhadas pode ampliar ainda mais os benefícios ambientais da transição.

No entanto, a transição para veículos elétricos enfrenta desafios significativos. O custo inicial dos VEs ainda é mais alto que o dos veículos tradicionais, embora a diferença esteja diminuindo à medida que a tecnologia melhora e a produção em escala aumenta. A disponibilidade de materiais críticos para baterias, como lítio e cobalto, também levanta preocupações sobre sustentabilidade e cadeias de suprimentos.

A questão do destino das baterias no fim de sua vida útil é outro desafio importante. O descarte inadequado de baterias pode causar danos ambientais significativos, e é necessário desenvolver infraestruturas robustas de reciclagem e reuso. Programas de segunda vida para baterias de veículos, onde elas são reutilizadas em aplicações estacionárias, podem ajudar a maximizar seu valor e minimizar o impacto ambiental.

A geração de eletricidade para carregar os VEs também é uma consideração crucial. Se a eletricidade vier de fontes fósseis, os benefícios ambientais dos VEs serão reduzidos. A transição para veículos elétricos deve ser acompanhada por uma transição paralela para fontes de energia renovável para maximizar os benefícios climáticos.

O impacto econômico da transição é profundo. Milhões de empregos em indústrias relacionadas a combustíveis fósseis podem ser afetados, enquanto novos empregos serão criados em setores como fabricação de baterias, infraestrutura de carregamento e desenvolvimento de software para veículos inteligentes. Políticas de transição justa são necessárias para garantir que os trabalhadores afetados não sejam deixados para trás.

A regulamentação está desempenhando um papel importante na aceleração da transição. Muitos países e regiões estabeleceram datas para proibir a venda de novos veículos a combustão, criando um prazo claro para a indústria se adaptar. Incentivos fiscais e subsídios para a compra de VEs também estão acelerando a adoção pelos consumidores.

A tecnologia continua evoluindo rapidamente, com inovações em baterias de estado sólido prometendo maior densidade de energia e segurança aprimorada. Carregamento ultrarrápido pode tornar o processo de recarregar tão rápido quanto abastecer um veículo tradicional, eliminando uma das principais barreiras restantes para a adoção.

Em resumo, a transformação da indústria automotiva é inevitável e já está em andamento, mas seu sucesso dependerá de uma abordagem holística que considere não apenas a tecnologia, mas também as implicações econômicas, sociais e ambientais dessa mudança fundamental.
        """
    }
]

def create_pdf(article_info, output_path):
    """Cria um PDF com o conteúdo do artigo."""
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Estilo personalizado para o corpo do texto
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['BodyText'],
        fontSize=11,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=12
    )
    
    # Estilo para o título
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor='#1a1a2e'
    )
    
    story = []
    
    # Adicionar título
    story.append(Paragraph(article_info['title'], title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Adicionar conteúdo dividido em parágrafos
    paragraphs = article_info['content'].split('\n\n')
    for para in paragraphs:
        if para.strip():
            story.append(Paragraph(para.strip(), body_style))
            story.append(Spacer(1, 0.1*inch))
    
    # Adicionar múltiplas quebras de página para garantir no mínimo 10 páginas
    for i in range(MIN_PAGES - 1):
        story.append(PageBreak())
        story.append(Paragraph(f"Continuação do documento - Página {i + 2}...", body_style))
        story.append(Spacer(1, 0.5*inch))
        # Adicionar conteúdo repetido para preencher as páginas
        for para in paragraphs[:3]:  # Usa os primeiros 3 parágrafos para preencher
            if para.strip():
                story.append(Paragraph(para.strip(), body_style))
                story.append(Spacer(1, 0.1*inch))
    
    doc.build(story)
    print(f"PDF criado: {output_path}")

def main():
    """Função principal para gerar todos os PDFs."""
    print("Gerando 5 PDFs com artigos...")
    
    for article in articles:
        output_path = os.path.join(OUTPUT_DIR, article['filename'])
        create_pdf(article, output_path)
    
    print(f"\nTodos os PDFs foram gerados com sucesso em: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
