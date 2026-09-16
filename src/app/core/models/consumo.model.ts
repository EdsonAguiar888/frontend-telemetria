export type NivelConsumo = 'ano' | 'mes' | 'dia';

export interface ConsumoItem {
  name: string;
  value: number;
}

export interface ConsumoFiltro {
  nivel: NivelConsumo;
  ano?: number;
  mes?: number;
}