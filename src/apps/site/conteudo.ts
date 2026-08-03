/**
 * Conteúdo da landing em um lugar só — texto de venda muda com frequência, e
 * mexer nele não deveria exigir abrir componente.
 *
 * Regra que vale a pena manter: **nada aqui é inventado**. Sem depoimento de
 * cliente que não existe, sem "500 escolas confiam", sem selo que ninguém
 * emitiu. O produto ainda não tem prova social — dizer que tem é a forma mais
 * barata de perder a primeira reunião com uma escola.
 */

export const APP_EDUCADOR = import.meta.env.VITE_APP_EDUCADOR ?? 'http://localhost:5175';
export const APP_RESPONSAVEL = import.meta.env.VITE_APP_RESPONSAVEL ?? 'http://localhost:5174';

export const PASSOS = [
  {
    numero: '01',
    titulo: 'A educadora registra a turma inteira',
    texto:
      'Seleciona as crianças, toca em “almoço”, escolhe a aceitação e pronto. Vinte registros em um gesto, não vinte formulários.',
  },
  {
    numero: '02',
    titulo: 'A família vê acontecer',
    texto:
      'A linha do tempo aparece no celular de casa em frases prontas: “No almoço, comeu metade”, “Dormiu tranquila das 12h45 às 14h15”.',
  },
  {
    numero: '03',
    titulo: 'O relatório do semestre já vem pronto',
    texto:
      'O parecer descritivo por campo de experiência da BNCC nasce dos registros do período, para o coordenador revisar em vez de escrever do zero.',
  },
];

export const PUBLICOS = [
  {
    titulo: 'Para quem está na sala',
    frase: 'Registrar não pode custar o tempo do colo.',
    itens: [
      'Registro em lote para a turma inteira',
      'Funciona sem internet — a sala tem wifi ruim, e tudo bem',
      'Alergias sempre em destaque, em toda tela',
      'Fechamento do turno mostrando o que faltou',
    ],
  },
  {
    titulo: 'Para quem está em casa',
    frase: 'A pergunta não é “como foi?”. É “ela comeu?”.',
    itens: [
      'O dia da criança em tempo real, em português claro',
      'Aviso no celular quando acontece algo importante',
      'Ocorrência sempre com o que a escola fez a respeito',
      'Comunicados, cardápio e recados no mesmo lugar',
    ],
  },
  {
    titulo: 'Para quem responde pela escola',
    frase: 'O que não está registrado não aconteceu.',
    itens: [
      'Quem registrou, o quê e quando — com trilha de auditoria',
      'Quem pode retirar cada criança, conferido na porta',
      'Taxa de leitura dos comunicados',
      'Medicação só com autorização vigente da família',
    ],
  },
];

export const DIFERENCIAIS = [
  {
    titulo: 'Funciona offline de verdade',
    texto:
      'O registro é gravado no aparelho antes de qualquer rede e sobe sozinho quando a conexão volta. O app mostra o que ainda está pendente — silêncio sobre isso destrói a confiança.',
  },
  {
    titulo: 'Dois aplicativos, não um',
    texto:
      'A educadora instala uma ferramenta de trabalho; a família instala algo sobre o filho. Interfaces, ícones e prioridades diferentes, porque as duas rotinas não se parecem.',
  },
  {
    titulo: 'Sem grupo de WhatsApp',
    texto:
      'O aviso chega pelo aplicativo e leva de volta para dentro dele, onde o histórico fica organizado. Quem não instalou recebe o resumo por e-mail — ninguém fica no escuro.',
  },
  {
    titulo: 'Dado de criança tratado como tal',
    texto:
      'Consentimento de imagem separado por finalidade e revogável, foto em armazenamento privado com link temporário, e bloqueio individual de visualização e retirada para casos de guarda compartilhada.',
  },
];

export const PLANOS = [
  {
    nome: 'Essencial',
    preco: '6,90',
    unidade: '/criança por mês',
    minimo: 'Mínimo de 20 crianças — R$ 138/mês',
    para: 'Creches pequenas começando a sair do papel.',
    itens: [
      'Chamada com entrada e saída',
      'Rotina: alimentação, sono, higiene, humor',
      'Fotos com controle de consentimento',
      'Comunicados e cardápio',
      'App da família ilimitado',
    ],
    destaque: false,
  },
  {
    nome: 'Profissional',
    preco: '11,90',
    unidade: '/criança por mês',
    minimo: 'Mínimo de 20 crianças — R$ 238/mês',
    para: 'Escolas que precisam responder por tudo que registram.',
    itens: [
      'Tudo do Essencial',
      'Ocorrências com conduta e ciência da família',
      'Medicação com autorização e dupla checagem',
      'Autorizados a retirar, conferidos na porta',
      'Relatório de desenvolvimento (BNCC) em PDF',
      'Trilha de auditoria completa',
    ],
    destaque: true,
  },
  {
    nome: 'Rede',
    preco: 'Sob medida',
    unidade: '',
    minimo: 'A partir de 3 unidades',
    para: 'Grupos e franquias com mais de uma escola.',
    itens: [
      'Tudo do Profissional',
      'Painel consolidado por unidade',
      'Aplicativo com a marca da escola',
      'Acesso único para a equipe da rede',
      'Suporte com pessoa responsável',
    ],
    destaque: false,
  },
];

export const PERGUNTAS = [
  {
    pergunta: 'Precisa instalar alguma coisa na loja de aplicativos?',
    resposta:
      'Não. O Diadeles abre no navegador e pode ser adicionado à tela de início em dois toques, ganhando ícone próprio e funcionando como aplicativo. Não depende de aprovação da Apple ou do Google, então a correção que fazemos hoje chega hoje.',
  },
  {
    pergunta: 'E quando o wifi da sala cai?',
    resposta:
      'A educadora continua registrando normalmente. Os lançamentos ficam guardados no aparelho, o app mostra quantos estão aguardando e tudo é enviado sozinho quando a conexão volta. Nada se perde e nada é registrado em duplicidade.',
  },
  {
    pergunta: 'Quem consegue ver as fotos do meu filho?',
    resposta:
      'Apenas os responsáveis com vínculo ativo, e apenas fotos em que a criança está marcada. O uso de imagem é autorizado por finalidade — uso interno, material impresso, redes sociais — e cada autorização pode ser retirada a qualquer momento, com efeito imediato.',
  },
  {
    pergunta: 'Como funciona em caso de guarda compartilhada?',
    resposta:
      'Cada responsável tem permissões próprias: um pode acompanhar sem poder retirar a criança, e é possível bloquear um acesso específico por decisão judicial. Quem busca a criança é conferido contra a lista de autorizados no momento da saída.',
  },
  {
    pergunta: 'A escola precisa trocar o sistema que já usa?',
    resposta:
      'Não. O Diadeles cuida da rotina pedagógica e da comunicação com a família. Ele convive com o sistema financeiro ou de matrículas que a escola já tenha.',
  },
  {
    pergunta: 'Quanto tempo leva para a equipe aprender?',
    resposta:
      'A tela principal tem uma função: marcar crianças e registrar. Na prática, uma educadora faz a turma inteira no primeiro dia. O acompanhamento de adesão por turma mostra à coordenação quem ainda não pegou o jeito.',
  },
];
