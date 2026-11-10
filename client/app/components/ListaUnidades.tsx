'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from "react";
import { Skeleton } from "./Loading";
import { authFetch } from "../lib/auth";
import "./ListaUnidades.css";

// Ajuste se o servidor da equipe usar outra porta.
const API = "http://localhost:3001/api/unidades";

const TIPOS = ["Matriz", "Filial", "Centro de distribuição"];

interface Unidade {
  id: number;
  nome: string;
  tipo: string;
  cidade: string;
  estado: string;
  status: string;
}

type FormUnidade = Omit<Unidade, 'id'>;

const FORM_VAZIO: FormUnidade = {
  nome: "",
  tipo: "Filial",
  cidade: "",
  estado: "",
  status: "ativa",
};

export default function ListaUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormUnidade>(FORM_VAZIO);

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const params = new URLSearchParams();
      if (busca) params.set("busca", busca);
      if (filtroStatus) params.set("status", filtroStatus);

      const resp = await authFetch(`${API}?${params}`);
      if (!resp.ok) throw new Error("Não foi possível carregar as unidades.");
      setUnidades(await resp.json());
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }

  // Recarrega ao mudar busca ou filtro (com pequena espera ao digitar).
  useEffect(() => {
    const espera = setTimeout(carregar, 300);
    return () => clearTimeout(espera);
  }, [busca, filtroStatus]);

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro("");
    setFormAberto(true);
  }

  function abrirEdicao(unidade: Unidade) {
    setEditandoId(unidade.id);
    setForm({
      nome: unidade.nome,
      tipo: unidade.tipo,
      cidade: unidade.cidade,
      estado: unidade.estado,
      status: unidade.status,
    });
    setErro("");
    setFormAberto(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setEditandoId(null);
  }

  function alterarCampo(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    try {
      const resp = await authFetch(editandoId ? `${API}/${editandoId}` : API, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) {
        const dados = await resp.json();
        throw new Error(dados.erro || "Erro ao salvar a unidade.");
      }
      fecharForm();
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  async function excluir(unidade: Unidade) {
    if (!window.confirm(`Excluir a unidade "${unidade.nome}"?`)) return;
    try {
      const resp = await authFetch(`${API}/${unidade.id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Erro ao excluir a unidade.");
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section className="unidades">
      <header className="unidades__topo">
        <h1>Unidades</h1>
        <button className="unidades-btn unidades-btn--primario" onClick={abrirNovo}>
          Nova unidade
        </button>
      </header>

      <div className="unidades__filtros">
        <input
          type="search"
          placeholder="Buscar por nome ou cidade"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar unidades"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          <option value="ativa">Ativas</option>
          <option value="inativa">Inativas</option>
        </select>
      </div>

      {erro && (
        <p className="unidades__erro" role="alert">
          {erro}
        </p>
      )}

      {formAberto && (
        <form className="unidades__form" onSubmit={salvar}>
          <h2>{editandoId ? "Editar unidade" : "Nova unidade"}</h2>

          <label>
            Nome
            <input name="nome" value={form.nome} onChange={alterarCampo} required />
          </label>

          <label>
            Tipo
            <select name="tipo" value={form.tipo} onChange={alterarCampo}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label>
            Cidade
            <input name="cidade" value={form.cidade} onChange={alterarCampo} required />
          </label>

          <label>
            Estado (UF)
            <input
              name="estado"
              value={form.estado}
              onChange={alterarCampo}
              maxLength={2}
              placeholder="PE"
              required
            />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={alterarCampo}>
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </label>

          <div className="unidades__acoes-form">
            <button type="button" className="unidades-btn" onClick={fecharForm}>
              Cancelar
            </button>
            <button type="submit" className="unidades-btn unidades-btn--primario">
              Salvar
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <div className="unidades__vazio" aria-busy="true" role="status">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full mb-3" />)}</div>
      ) : unidades.length === 0 ? (
        <p className="unidades__vazio">
          Nenhuma unidade encontrada. Ajuste a busca ou cadastre uma nova unidade.
        </p>
      ) : (
        <div className="unidades__tabela-wrap">
          <table className="unidades__tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Cidade</th>
                <th>UF</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <tr key={u.id} className="animate-fade-in-up">
                  <td>{u.nome}</td>
                  <td>{u.tipo}</td>
                  <td>{u.cidade}</td>
                  <td>{u.estado}</td>
                  <td>
                    <span className={`unidades-selo unidades-selo--${u.status}`}>
                      {u.status === "ativa" ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="unidades__acoes">
                    <button className="unidades-btn unidades-btn--link" onClick={() => abrirEdicao(u)}>
                      Editar
                    </button>
                    <button className="unidades-btn unidades-btn--link unidades-btn--perigo" onClick={() => excluir(u)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
