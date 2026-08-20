import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus, UserX } from 'lucide-react';
import { useState } from 'react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import {
  Aviso,
  Botao,
  Campo,
  Cartao,
  Carregando,
  Etiqueta,
  RotuloSecao,
  Selecao,
  Vazio,
} from '@/shared/ui/componentes';
import { Cabecalho } from '../componentes/Cabecalho';

const PAPEIS: Record<string, string> = {
  SUPER_ADMIN: 'Administração',
  REDE_ADMIN: 'Rede',
  GESTOR: 'Gestão',
  COORDENADOR: 'Coordenação',
  EDUCADOR: 'Educador',
  AUXILIAR: 'Auxiliar',
  RESPONSAVEL: 'Família',
};

/** O que a gestão pode conceder pela tela. `SUPER_ADMIN` não entra aqui. */
const ATRIBUIVEIS = ['EDUCADOR', 'AUXILIAR', 'COORDENADOR', 'GESTOR'] as const;

type PapelAtribuivel = (typeof ATRIBUIVEIS)[number];

interface NovoMembro {
  nome: string;
  email: string;
  papel: PapelAtribuivel;
}

const VAZIO: NovoMembro = { nome: '', email: '', papel: 'EDUCADOR' };

export function Equipe() {
  const cliente = useQueryClient();
  const [novo, setNovo] = useState<NovoMembro | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ nome: string; senha: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['equipe'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/equipe');
      if (error) throw error;
      return data;
    },
  });

  const recarregar = () => cliente.invalidateQueries({ queryKey: ['equipe'] });

  const criar = useMutation({
    mutationFn: async (dados: NovoMembro) => {
      const { data, error } = await api.POST('/v1/equipe', {
        body: {
          nome: dados.nome.trim(),
          email: dados.email.trim(),
          papeis: [dados.papel],
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (resposta) => {
      setNovo(null);
      if (resposta?.senhaProvisoria) {
        setSenhaGerada({ nome: resposta.membro.nome, senha: resposta.senhaProvisoria });
      }
      await recarregar();
    },
  });

  const alternarAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await api.PATCH('/v1/equipe/{id}', {
        params: { path: { id } },
        body: { ativo },
      });
      if (error) throw error;
    },
    onSuccess: recarregar,
  });

  if (isLoading || !data) {
    return (
      <>
        <Cabecalho titulo="Equipe" voltarPara="/gestao" />
        <Carregando texto="Buscando a equipe…" />
      </>
    );
  }

  return (
    <div className="min-h-full pb-10">
      <Cabecalho
        titulo="Equipe"
        subtitulo={`${data.length} ${data.length === 1 ? 'pessoa' : 'pessoas'}`}
        voltarPara="/gestao"
      />

      <main className="space-y-(--gap-lista) px-4 py-4">
        {(criar.error || alternarAtivo.error) && (
          <Aviso>{mensagemDeErro(criar.error ?? alternarAtivo.error)}</Aviso>
        )}

        {/* A senha provisória aparece uma única vez. Some ao sair da tela, e a
            secretaria precisa passá-la à pessoa antes disso. */}
        {senhaGerada && (
          <Cartao interno className="space-y-2">
            <RotuloSecao>Senha de {senhaGerada.nome}</RotuloSecao>
            <p className="numerico rounded-(--raio) bg-[color:var(--color-papel)] p-3 text-center text-lg font-semibold tracking-widest">
              {senhaGerada.senha}
            </p>
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-[color:var(--color-tinta-suave)]">
              <KeyRound size={13} className="mt-0.5 shrink-0" />
              Anote e entregue agora: esta senha não fica guardada e não dá para consultá-la de
              novo.
            </p>
            <Botao variante="secundario" bloco onClick={() => setSenhaGerada(null)}>
              Já anotei
            </Botao>
          </Cartao>
        )}

        {novo ? (
          <Cartao interno className="space-y-3">
            <RotuloSecao>Nova pessoa</RotuloSecao>
            <Campo
              rotulo="Nome"
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
            />
            <Campo
              rotulo="E-mail"
              type="email"
              autoCapitalize="none"
              value={novo.email}
              apoio="É por ele que a pessoa entra no app."
              onChange={(e) => setNovo({ ...novo, email: e.target.value })}
            />
            <Selecao
              rotulo="Papel"
              value={novo.papel}
              onChange={(e) => setNovo({ ...novo, papel: e.target.value as PapelAtribuivel })}
              apoio="Educador e auxiliar registram a rotina; coordenação e gestão administram a escola."
            >
              {ATRIBUIVEIS.map((papel) => (
                <option key={papel} value={papel}>
                  {PAPEIS[papel]}
                </option>
              ))}
            </Selecao>
            <div className="flex gap-2">
              <Botao
                bloco
                disabled={criar.isPending || novo.nome.trim().length < 2 || !novo.email.includes('@')}
                onClick={() => criar.mutate(novo)}
              >
                {criar.isPending ? 'Cadastrando…' : 'Cadastrar'}
              </Botao>
              <Botao variante="secundario" onClick={() => setNovo(null)}>
                Cancelar
              </Botao>
            </div>
          </Cartao>
        ) : (
          <Botao bloco onClick={() => setNovo(VAZIO)}>
            <Plus size={16} /> Nova pessoa
          </Botao>
        )}

        {data.length === 0 && (
          <Vazio
            icone={<UserX size={22} />}
            titulo="Ninguém cadastrado ainda"
            descricao="Convide a equipe para que ela possa registrar a rotina das turmas."
          />
        )}

        {data.map((membro) => (
          <Cartao key={membro.id} interno className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{membro.nome}</p>
                {membro.email && (
                  <p className="truncate text-xs text-[color:var(--color-tinta-tenue)]">
                    {membro.email}
                  </p>
                )}
              </div>
              {!membro.ativo && <Etiqueta tom="alerta">inativo</Etiqueta>}
            </div>

            <div className="flex flex-wrap gap-1">
              {membro.papeis.map((papel) => (
                <Etiqueta key={papel} tom="marca">
                  {PAPEIS[papel] ?? papel}
                </Etiqueta>
              ))}
              {membro.turmas.map((turma) => (
                <Etiqueta key={turma}>{turma}</Etiqueta>
              ))}
            </div>

            {/* Quem nunca acessou não recebe nada do que a escola publica. É o
                que a coordenação precisa saber antes de cobrar o registro. */}
            <p className="text-xs text-[color:var(--color-tinta-tenue)]">
              {membro.ultimoAcesso
                ? `Último acesso ${formatarAcesso(membro.ultimoAcesso)}`
                : 'Nunca acessou o app'}
            </p>

            <Botao
              variante="fantasma"
              bloco
              disabled={alternarAtivo.isPending}
              onClick={() => alternarAtivo.mutate({ id: membro.id, ativo: !membro.ativo })}
            >
              {membro.ativo ? 'Desativar acesso' : 'Reativar acesso'}
            </Botao>
          </Cartao>
        ))}
      </main>
    </div>
  );
}

function formatarAcesso(iso: string): string {
  const data = new Date(iso);
  const dias = Math.floor((Date.now() - data.getTime()) / 86_400_000);

  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  return data.toLocaleDateString('pt-BR');
}
