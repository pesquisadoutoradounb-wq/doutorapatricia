/**
 * Testes de RLS — superfície crítica do sub-projeto A.
 *
 * Exigem um Supabase local rodando (`supabase start`) e as variáveis:
 *   SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, SUPABASE_TEST_SERVICE_ROLE_KEY
 *
 * Rode com:  npm run test:rls
 * São PULADOS automaticamente se as variáveis não estiverem definidas
 * (por isso não quebram o `npm test` do deploy de Pages).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_TEST_URL;
const ANON = process.env.SUPABASE_TEST_ANON_KEY;
const SERVICE = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;

const rodar = Boolean(URL && ANON && SERVICE);

describe.skipIf(!rodar)("RLS — isolamento entre participantes", () => {
  let admin: SupabaseClient;
  let inviteA: string;
  let inviteB: string;
  let participantA: string;
  let participantB: string;

  async function sessaoParaParticipante(participantId: string): Promise<SupabaseClient> {
    const c = createClient(URL!, ANON!, { auth: { persistSession: false } });
    const { data, error } = await c.auth.signInAnonymously();
    if (error || !data.user) throw error ?? new Error("sem usuário anônimo");
    await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { participant_id: participantId },
    });
    await c.auth.refreshSession();
    return c;
  }

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, { auth: { persistSession: false } });

    const { data: iA } = await admin
      .from("invites")
      .insert({ email: "a@example.test", modo: "piloto" })
      .select("id")
      .single();
    const { data: iB } = await admin
      .from("invites")
      .insert({ email: "b@example.test", modo: "piloto" })
      .select("id")
      .single();
    inviteA = iA!.id;
    inviteB = iB!.id;

    const { data: pA } = await admin
      .from("participants")
      .insert({ invite_id: inviteA, modo: "piloto" })
      .select("id")
      .single();
    const { data: pB } = await admin
      .from("participants")
      .insert({ invite_id: inviteB, modo: "piloto" })
      .select("id")
      .single();
    participantA = pA!.id;
    participantB = pB!.id;
  });

  afterAll(async () => {
    await admin.from("consent_records").delete().in("participant_id", [participantA, participantB]);
    await admin.from("participants").delete().in("id", [participantA, participantB]);
    await admin.from("invites").delete().in("id", [inviteA, inviteB]);
  });

  it("participante lê a própria linha e NÃO a de outro", async () => {
    const cA = await sessaoParaParticipante(participantA);

    const proprio = await cA.from("participants").select("id").eq("id", participantA);
    expect(proprio.data).toHaveLength(1);

    const alheio = await cA.from("participants").select("id").eq("id", participantB);
    expect(alheio.data ?? []).toHaveLength(0);
  });

  it("participante não consegue gravar consentimento em nome de outro", async () => {
    const cA = await sessaoParaParticipante(participantA);

    const alheio = await cA.from("consent_records").insert({
      participant_id: participantB,
      tcle_versao: "x",
      tcle_texto_snapshot: "y",
      decisao: "aceitou",
    });
    expect(alheio.error).toBeTruthy();

    const proprio = await cA.from("consent_records").insert({
      participant_id: participantA,
      tcle_versao: "x",
      tcle_texto_snapshot: "y",
      decisao: "aceitou",
    });
    expect(proprio.error).toBeNull();
  });

  it("consent_records é imutável (sem update/delete)", async () => {
    const cA = await sessaoParaParticipante(participantA);
    const upd = await cA
      .from("consent_records")
      .update({ decisao: "recusou" })
      .eq("participant_id", participantA);
    expect(upd.error).toBeTruthy();
  });

  it("sessão anônima sem claim não lê nada de participants nem invites", async () => {
    const anon = createClient(URL!, ANON!, { auth: { persistSession: false } });
    await anon.auth.signInAnonymously();

    const p = await anon.from("participants").select("id");
    expect(p.data ?? []).toHaveLength(0);

    const i = await anon.from("invites").select("id");
    expect(i.data ?? []).toHaveLength(0);
  });

  it("participante não enxerga a tabela de convites", async () => {
    const cA = await sessaoParaParticipante(participantA);
    const r = await cA.from("invites").select("id");
    expect(r.data ?? []).toHaveLength(0);
  });

  it("etapa_atual não pode pular etapas", async () => {
    const cA = await sessaoParaParticipante(participantA);
    const r = await cA
      .from("participants")
      .update({ etapa_atual: "vinhetas" })
      .eq("id", participantA);
    expect(r.error).toBeTruthy();
  });

  it("participante não lê as tabelas-base de instrumento, só as views", async () => {
    const cA = await sessaoParaParticipante(participantA);

    // base: só admin
    const base = await cA.from("ysq_items").select("item");
    expect(base.data ?? []).toHaveLength(0);
    const vBase = await cA.from("vignettes").select("id, dominio");
    expect(vBase.data ?? []).toHaveLength(0);

    // view: leitura permitida (não deve dar erro de permissão)
    const view = await cA.from("vinhetas_participante").select("id");
    expect(view.error).toBeNull();
  });
});
