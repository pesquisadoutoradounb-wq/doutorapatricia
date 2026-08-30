import { supabase } from "./supabase";

export interface VinhetaAdmin {
  id: number;
  titulo_interno: string;
  dominio: number;
}

export interface AudioAtual {
  vignette_id: number;
  storage_path: string;
  duracao_segundos: number | null;
  url: string;
}

export async function carregarVinhetasDoEstudo(
  studyId: string,
): Promise<VinhetaAdmin[]> {
  const { data, error } = await supabase
    .from("vignettes")
    .select("id, titulo_interno, dominio")
    .eq("study_id", studyId)
    .order("id");
  if (error || !data) return [];
  return data as VinhetaAdmin[];
}

export async function carregarAudiosAtuais(
  vignetteIds: number[],
): Promise<Map<number, AudioAtual>> {
  if (vignetteIds.length === 0) return new Map();
  const { data } = await supabase
    .from("audio_assets")
    .select("vignette_id, storage_path, duracao_segundos")
    .in("vignette_id", vignetteIds);
  const mapa = new Map<number, AudioAtual>();
  for (const d of data ?? []) {
    const { data: pub } = supabase.storage
      .from("audios")
      .getPublicUrl(d.storage_path as string);
    mapa.set(d.vignette_id as number, {
      vignette_id: d.vignette_id as number,
      storage_path: d.storage_path as string,
      duracao_segundos: (d.duracao_segundos as number | null) ?? null,
      url: pub.publicUrl,
    });
  }
  return mapa;
}

/** Duração do áudio (segundos) lida no cliente antes do upload; best-effort. */
function duracaoDoArquivo(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const el = document.createElement("audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(el.src);
      resolve(Number.isFinite(el.duration) ? Math.round(el.duration * 10) / 10 : null);
    };
    el.onerror = () => resolve(null);
    el.src = URL.createObjectURL(file);
  });
}

export async function enviarAudio(
  studySlug: string,
  vignetteId: number,
  file: File,
): Promise<{ error: string | null }> {
  const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
  const path = `${studySlug}/vinheta-${vignetteId}.${ext}`;

  const dur = await duracaoDoArquivo(file);

  const up = await supabase.storage
    .from("audios")
    .upload(path, file, { upsert: true, contentType: file.type || "audio/mpeg" });
  if (up.error) return { error: up.error.message };

  const { error } = await supabase.from("audio_assets").upsert(
    { vignette_id: vignetteId, storage_path: path, duracao_segundos: dur },
    { onConflict: "vignette_id" },
  );
  return { error: error?.message ?? null };
}
