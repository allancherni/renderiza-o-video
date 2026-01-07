
import { Caption } from "../types";

export interface ParseResult {
  captions: Caption[];
  error?: string;
}

/**
 * Converte o texto bruto no formato "START - END: TEXTO" em um array de objetos Caption.
 * Exemplo: "0.0 - 2.5: Bolsa feminina"
 */
export const parseCaptionsManual = (text: string, videoDuration?: number): ParseResult => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const captions: Caption[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Regex para capturar: [Número] - [Número] : [Texto]
    // Suporta pontos ou vírgulas decimais
    const regex = /^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)\s*:\s*(.+)$/;
    const match = line.match(regex);

    if (!match) {
      return {
        captions: [],
        error: `Erro na linha ${i + 1}: "${line}". O formato deve ser "INÍCIO - FIM: TEXTO" (ex: 0.0 - 2.5: Olá mundo).`
      };
    }

    const startStr = match[1].replace(',', '.');
    const endStr = match[2].replace(',', '.');
    const content = match[3].trim();

    const start = parseFloat(startStr);
    const end = parseFloat(endStr);

    if (isNaN(start) || isNaN(end)) {
      return { captions: [], error: `Erro na linha ${i + 1}: Tempos inválidos.` };
    }

    if (start >= end) {
      return { captions: [], error: `Erro na linha ${i + 1}: O tempo de início (${start}s) deve ser menor que o tempo de fim (${end}s).` };
    }

    if (videoDuration && end > videoDuration) {
      return { 
        captions: [], 
        error: `Erro na linha ${i + 1}: O tempo de fim (${end}s) excede a duração do vídeo (${videoDuration.toFixed(2)}s).` 
      };
    }

    captions.push({
      start: startStr,
      end: endStr,
      text: content
    });
  }

  if (captions.length === 0) {
    return { captions: [], error: "Nenhuma legenda encontrada. Digite ao menos uma linha." };
  }

  return { captions };
};
