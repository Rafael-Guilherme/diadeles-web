/**
 * Os três documentos legais do site.
 *
 * **São modelos, e o site diz isso em cima de cada página.** O conteúdo aqui é
 * um esqueleto correto — as seções que a LGPD exige, os papéis de controladora
 * e operadora que `plano-produto.md` §11 define, a régua de inadimplência que o
 * produto realmente aplica — escrito para ser revisado por advogado, não para
 * passar por um. Publicar isto como definitivo seria o mesmo erro que
 * `conteudo.ts` evita do outro lado: afirmar como verdade o que ainda não foi
 * verificado.
 *
 * Os campos entre colchetes (`[CNPJ]`, `[nome do encarregado]`) ficam à vista
 * de propósito. Um documento legal com um dado inventado é pior que um
 * documento incompleto: o incompleto se vê.
 *
 * Quando a revisão vier, é este arquivo que muda.
 */

export interface SecaoLegal {
  titulo: string;
  paragrafos?: string[];
  itens?: string[];
}

export interface DocumentoLegal {
  slug: string;
  titulo: string;
  resumo: string;
  atualizadoEm: string;
  secoes: SecaoLegal[];
}

/** Uma data só para os três: eles são revisados juntos ou não são revisados. */
const ATUALIZADO_EM = 'ainda não publicado';

const OPERADOR =
  'A escola é a **controladora** dos dados: é ela quem decide o que registrar sobre cada criança e ' +
  'por quê. A Diadeles é a **operadora**: trata os dados em nome da escola, seguindo o que ela ' +
  'determina, e não os usa para finalidade própria. Essa divisão define quem responde por um ' +
  'incidente e está no contrato entre as partes.';

export const TERMOS: DocumentoLegal = {
  slug: 'termos',
  titulo: 'Termos de uso',
  resumo: 'As regras do contrato entre a Diadeles e a escola que a contrata.',
  atualizadoEm: ATUALIZADO_EM,
  secoes: [
    {
      titulo: '1. Quem contrata e quem presta',
      paragrafos: [
        'Estes termos regem o uso da plataforma Diadeles, oferecida por [razão social], inscrita no CNPJ sob o nº [CNPJ], com sede em [endereço].',
        'A contratante é a instituição de educação infantil que adere ao serviço ("a escola"). Educadores, coordenação, gestão e famílias usam a plataforma a partir dos acessos que a escola concede.',
      ],
    },
    {
      titulo: '2. O que a plataforma faz',
      paragrafos: [
        'A Diadeles registra a rotina diária da educação infantil — presença, alimentação, sono, higiene, atividades, ocorrências e medicação —, compartilha esse registro com as famílias vinculadas e gera o parecer descritivo semestral a partir do que foi registrado.',
        'A plataforma é um instrumento de registro. Ela não substitui o julgamento pedagógico da equipe, não emite diagnóstico, não avalia a criança e não decide nada sobre ela.',
      ],
    },
    {
      titulo: '3. Papéis no tratamento de dados',
      paragrafos: [OPERADOR],
    },
    {
      titulo: '4. Contas e acessos',
      paragrafos: [
        'A escola é responsável pelas contas que cria e pelos papéis que atribui. Cada pessoa da equipe tem acesso individual — contas compartilhadas quebram a trilha de auditoria e não são permitidas.',
        'As famílias entram por convite emitido pela escola, e a sessão fica vinculada ao aparelho. A escola pode revogar qualquer acesso a qualquer momento.',
        'A escola avisará a Diadeles sem demora ao tomar conhecimento de uso indevido de uma conta.',
      ],
    },
    {
      titulo: '5. Preço, cobrança e inadimplência',
      paragrafos: [
        'O valor é apurado mensalmente pelo número de crianças com matrícula ativa, respeitado o mínimo do plano contratado. A apuração ocorre no primeiro dia de cada mês e a cobrança é emitida por competência.',
        'Em caso de atraso, aplica-se a seguinte régua, contada do vencimento:',
      ],
      itens: [
        'D+3 — aviso à gestão da escola por notificação e e-mail;',
        'D+10 — aviso visível na tela para toda a equipe;',
        'D+20 — suspensão da escrita no aplicativo da equipe.',
      ],
    },
    {
      titulo: '6. O que a suspensão não atinge',
      paragrafos: [
        'A suspensão por inadimplência corta o registro de novos dados pela equipe. Ela **não** corta o acesso das famílias ao histórico já registrado: a dívida é da escola, e tirar o pai do ar por isso puniria quem não é parte do contrato.',
        'Registros feitos sem conexão antes da suspensão não se perdem — sobem assim que o pagamento é confirmado.',
      ],
    },
    {
      titulo: '7. Disponibilidade e manutenção',
      paragrafos: [
        'A Diadeles envida os melhores esforços para manter a plataforma disponível, sem garantir operação ininterrupta. Manutenções programadas serão comunicadas com antecedência de [prazo].',
        'O aplicativo da equipe funciona sem conexão para o registro da rotina, e sincroniza quando a conexão volta.',
      ],
    },
    {
      titulo: '8. Vigência, rescisão e saída',
      paragrafos: [
        'O contrato vigora por prazo indeterminado e pode ser encerrado por qualquer das partes mediante aviso de [prazo].',
        'Encerrado o contrato, a escola poderá exportar os dados registrados pelo prazo de [prazo] antes da eliminação definitiva. A exportação é oferecida antes de qualquer descarte.',
      ],
    },
    {
      titulo: '9. Propriedade intelectual',
      paragrafos: [
        'A plataforma, seu código e sua identidade visual pertencem à Diadeles. Os dados registrados pela escola pertencem à escola.',
      ],
    },
    {
      titulo: '10. Limitação de responsabilidade',
      paragrafos: [
        'A Diadeles não responde por decisões pedagógicas ou operacionais tomadas pela escola com apoio da plataforma, nem por conteúdo registrado incorretamente por seus usuários.',
        '[Cláusula de limitação a ser definida em revisão jurídica.]',
      ],
    },
    {
      titulo: '11. Alterações e foro',
      paragrafos: [
        'Alterações relevantes nestes termos serão comunicadas à escola com antecedência de [prazo].',
        'Fica eleito o foro da comarca de [comarca] para dirimir controvérsias.',
      ],
    },
  ],
};

export const PRIVACIDADE: DocumentoLegal = {
  slug: 'privacidade',
  titulo: 'Política de privacidade',
  resumo: 'Quais dados a Diadeles trata, para quê, por quanto tempo e com quem os compartilha.',
  atualizadoEm: ATUALIZADO_EM,
  secoes: [
    {
      titulo: '1. Nosso papel',
      paragrafos: [
        OPERADOR,
        'Esta política descreve como a Diadeles trata os dados que recebe da escola. Para saber o que a sua escola decidiu registrar e por quê, fale com ela.',
      ],
    },
    {
      titulo: '2. Que dados tratamos',
      itens: [
        '**Da criança**: nome, data de nascimento, turma e matrícula; registros de rotina (presença, alimentação, sono, higiene, atividades); ocorrências e condutas adotadas; autorizações e administrações de medicamento; parecer descritivo semestral.',
        '**Da família**: nome, celular, e-mail quando informado, tipo de vínculo e permissões de visualização e retirada; recados enviados à escola.',
        '**Da equipe**: nome, e-mail, papel, turmas atribuídas e registro de acessos.',
        '**Técnicos**: endereço IP, identificação do aparelho e registros de acesso, usados para segurança e para a trilha de auditoria.',
      ],
    },
    {
      titulo: '3. Para que tratamos',
      itens: [
        'Executar o serviço contratado pela escola — registrar a rotina e compartilhá-la com quem tem vínculo ativo;',
        'Cumprir obrigações da escola de documentar o acompanhamento pedagógico;',
        'Garantir a segurança do serviço e manter a trilha de auditoria de quem acessou dado sensível e de quem autorizou a retirada de uma criança;',
        'Faturar a escola contratante.',
      ],
      paragrafos: [
        'Não usamos dados de criança para publicidade, perfilamento comportamental, treinamento de modelos ou qualquer finalidade que não seja a execução do serviço. Não vendemos dados a ninguém.',
      ],
    },
    {
      titulo: '4. Bases legais',
      paragrafos: [
        'O tratamento se apoia na execução do contrato com a escola, no cumprimento de obrigação legal e regulatória e, no que se refere a dados de crianças, no consentimento específico e destacado de ao menos um dos pais ou responsável legal, na forma do art. 14 da LGPD.',
      ],
    },
    {
      titulo: '5. Com quem compartilhamos',
      paragrafos: [
        'Apenas com prestadores necessários à operação, cada um vinculado por contrato e limitado à finalidade:',
      ],
      itens: [
        '**Infraestrutura e banco de dados** — hospedagem em território brasileiro;',
        '**Envio de e-mail** — para os avisos que não chegam por notificação;',
        '**Meio de pagamento** — para a cobrança da escola; recebe dados da escola, não da criança.',
      ],
    },
    {
      titulo: '6. Por quanto tempo guardamos',
      itens: [
        'Registros pedagógicos: 5 anos, prazo alinhado à guarda documental escolar;',
        'Trilha de auditoria: [prazo];',
        'Dados de conta: enquanto durar o vínculo, e por [prazo] após o encerramento.',
      ],
      paragrafos: [
        'Antes de qualquer descarte, a exportação é oferecida à escola e, quando aplicável, à família.',
      ],
    },
    {
      titulo: '7. Segurança',
      itens: [
        'Tráfego cifrado de ponta a ponta e dados hospedados no Brasil;',
        'Senhas guardadas apenas como hash — ninguém na Diadeles consegue ler a senha de alguém;',
        'Acesso por papel: o educador vê a turma dele, a família vê a criança dela;',
        'Trilha de auditoria de toda leitura de dado de saúde e de toda decisão sobre quem retira uma criança.',
      ],
    },
    {
      titulo: '8. Seus direitos',
      paragrafos: [
        'A LGPD garante ao titular confirmação do tratamento, acesso, correção, anonimização, portabilidade, informação sobre compartilhamento e revogação do consentimento.',
        'Como somos operadores, o pedido começa na escola, que é a controladora. Recebido um pedido diretamente, nós o encaminhamos a ela e a apoiamos no atendimento.',
      ],
    },
    {
      titulo: '9. Armazenamento no seu aparelho',
      paragrafos: [
        'O aplicativo guarda no próprio aparelho a sua sessão e os registros feitos sem conexão, para que o trabalho não se perca em área sem sinal. Não usamos cookies de rastreamento nem ferramentas de análise de terceiros.',
      ],
    },
    {
      titulo: '10. Encarregado (DPO)',
      paragrafos: [
        'Encarregado: [nome]. Contato: [e-mail do encarregado].',
      ],
    },
  ],
};

export const DADOS_DE_CRIANCAS: DocumentoLegal = {
  slug: 'dados-de-criancas',
  titulo: 'Tratamento de dados de crianças',
  resumo:
    'O regime do art. 14 da LGPD, aplicado a um produto cujo dado principal é a rotina de uma criança pequena.',
  atualizadoEm: ATUALIZADO_EM,
  secoes: [
    {
      titulo: '1. Por que este documento existe separado',
      paragrafos: [
        'Dado de criança tem regime próprio na LGPD e é o maior risco deste produto. Diluí-lo no meio da política de privacidade seria escondê-lo.',
        'Toda decisão descrita aqui é orientada pelo **melhor interesse da criança**, conforme o art. 14 da LGPD.',
      ],
    },
    {
      titulo: '2. Consentimento',
      paragrafos: [
        'O tratamento de dados de criança depende de consentimento específico e destacado de ao menos um dos pais ou do responsável legal, colhido pela escola.',
        'O consentimento é revogável a qualquer momento, com efeito imediato, e a revogação é comunicada à escola.',
      ],
    },
    {
      titulo: '3. O que não fazemos',
      itens: [
        'Não exibimos publicidade — nem para a família, nem para a escola;',
        'Não construímos perfil comportamental de criança nenhuma;',
        'Não compartilhamos dado de criança com terceiros para finalidade própria deles;',
        'Não usamos dado de criança para treinar modelos de inteligência artificial;',
        'Não condicionamos o uso do serviço a mais dados do que o necessário.',
      ],
    },
    {
      titulo: '4. Fotografia e imagem',
      paragrafos: [
        'A plataforma **não guarda foto nem vídeo de criança**. O recurso está fora do escopo atual, e as tabelas que o suportariam foram removidas do banco.',
        'Quando a galeria existir, virá com consentimento de imagem próprio, separado do consentimento geral e granular por finalidade (uso interno, material impresso, redes sociais), revogável a qualquer momento e com efeito imediato. Até lá, não há o que consentir.',
      ],
    },
    {
      titulo: '5. Guarda compartilhada e medida protetiva',
      paragrafos: [
        'Nem toda família é uma casa só, e nem todo adulto próximo pode buscar a criança. A plataforma trata isso como regra de produto, não como exceção.',
        'Cada vínculo tem permissões próprias de visualizar, retirar e autorizar terceiros, e pode ser bloqueado individualmente — com motivo registrado e o nome de quem aplicou o bloqueio.',
        'A retirada da criança é conferida contra a lista de autorizados. Quem não está na lista só passa como saída excepcional, com motivo escrito e registro em auditoria do nome de quem liberou.',
      ],
    },
    {
      titulo: '6. Dados de saúde',
      paragrafos: [
        'Alergias, restrições alimentares, medicação autorizada e ocorrências são dados sensíveis. Toda leitura de dado de saúde fica registrada na trilha de auditoria, com quem leu e quando.',
        'A administração de medicamento exige autorização prévia da família e dupla checagem no momento da dose.',
      ],
    },
    {
      titulo: '7. O parecer descritivo',
      paragrafos: [
        'O rascunho do parecer semestral é montado a partir do que foi efetivamente registrado, e é composto apenas de contagens — nunca de adjetivo, juízo ou nível de desenvolvimento.',
        'Campo sem evidência sai em branco, para o educador escrever. Quem escreve o parecer não o publica: a publicação é da coordenação. Publicado, o texto não muda mais.',
      ],
    },
    {
      titulo: '8. Retenção e descarte',
      paragrafos: [
        'Registros pedagógicos são guardados por 5 anos. Antes de qualquer descarte, a exportação é oferecida à família.',
      ],
    },
    {
      titulo: '9. Como exercer direitos',
      paragrafos: [
        'O pedido começa na escola, que é a controladora dos dados. O encarregado da Diadeles apoia o atendimento: [e-mail do encarregado].',
      ],
    },
  ],
};

export const DOCUMENTOS = [TERMOS, PRIVACIDADE, DADOS_DE_CRIANCAS];
