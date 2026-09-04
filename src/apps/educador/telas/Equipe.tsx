import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Plus } from 'lucide-react';
import { useState } from 'react';
import { api, mensagemDeErro } from '@/shared/api/cliente';
import { Avatar, Aviso, Botao, Campo, Carregando, Cartao, Etiqueta, RotuloSecao, Selecao, Vazio } from '@/shared/ui/componentes';
import { LayoutGestao, Tabela, Td, Th, Tr } from '../componentes/LayoutGestao';

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
      <LayoutGestao titulo="Equipe">
        <Carregando texto="Buscando a equipe…" />
      </LayoutGestao>
    );
  }

  return (
    <LayoutGestao
      titulo="Equipe"
      descricao={`${data.length} ${data.length === 1 ? 'pessoa' : 'pessoas'} com acesso ao app`}
      acoes={
        !novo && (
          <Botao tamanho="compacto" onClick={() => setNovo(VAZIO)}>
            <Plus size={15} /> Nova pessoa
          </Botao>
        )
      }
    >
      <div className="space-y-(--gap-lista)">
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
          ) : null}

          {data.length === 0 && (
            <Vazio
              titulo="Ninguém cadastrado ainda"
              descricao="Convide a equipe para que ela possa registrar a rotina das turmas."
            />
          )}

          {data.length > 0 && (
            <Tabela>
              <thead>
                <tr>
                  <Th>Pessoa</Th>
                  <Th>Papel</Th>
                  <Th>Turmas</Th>
                  <Th>Último acesso</Th>
                  <Th className="text-right">Acesso</Th>
                </tr>
              </thead>
              <tbody>
                {data.map((membro) => (
                  <Tr key={membro.id} atencao={!membro.ativo}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar nome={membro.nome} tamanho="sm" />
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
                    </Td>
                    <Td className="text-[color:var(--color-tinta-suave)]">
                      {membro.papeis.map((papel) => PAPEIS[papel] ?? papel).join(', ')}
                    </Td>
                    <Td className="text-[color:var(--color-tinta-suave)]">
                      {membro.turmas.length > 0 ? membro.turmas.join(', ') : 'cadastro apenas'}
                    </Td>
                    {/* Quem nunca acessou não recebe nada do que a escola
                        publica. É o que a coordenação precisa saber antes de
                        cobrar o registro. */}
                    <Td
                      className={`numerico ${
                        membro.ultimoAcesso
                          ? 'text-[color:var(--color-tinta-suave)]'
                          : 'font-semibold text-[color:var(--color-sol-700)]'
                      }`}
                    >
                      {membro.ultimoAcesso ? formatarAcesso(membro.ultimoAcesso) : 'nunca entrou'}
                    </Td>
                    <Td className="text-right">
                      <Botao
                        variante="secundario"
                        tamanho="compacto"
                        disabled={alternarAtivo.isPending}
                        onClick={() => alternarAtivo.mutate({ id: membro.id, ativo: !membro.ativo })}
                      >
                        {membro.ativo ? 'Desativar' : 'Reativar'}
                      </Botao>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Tabela>
          )}
      </div>
    </LayoutGestao>
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
