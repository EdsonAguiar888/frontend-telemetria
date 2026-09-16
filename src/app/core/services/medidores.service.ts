import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medidor } from '../models/medidor.model';
import { ConsumoFiltro, ConsumoItem } from '../models/consumo.model';

@Injectable({
  providedIn: 'root'
})
export class MedidoresService {
  private readonly apiUrl = 'http://localhost:3000/medidores';

  constructor(private readonly http: HttpClient) {}

  // GET /medidores - Lista todos os medidores e seus imóveis
  listar(): Observable<Medidor[]> {
    return this.http.get<Medidor[]>(this.apiUrl);
  }

  // GET /medidores/:id - Busca um medidor, imóvel e histórico de leituras
  buscarPorId(id: string): Observable<Medidor> {
    return this.http.get<Medidor>(`${this.apiUrl}/${id}`);
  }

  // POST /medidores - Cadastra medidor vinculado a um imóvel
  criar(medidor: { identificador: string; tipo: string; imovelId: string }): Observable<Medidor> {
    return this.http.post<Medidor>(this.apiUrl, medidor);
  }

  // PATCH /medidores/:id - Atualiza dados do medidor
  atualizar(id: string, medidor: Partial<Medidor>): Observable<Medidor> {
    return this.http.patch<Medidor>(`${this.apiUrl}/${id}`, medidor);
  }

  // DELETE /medidores/:id - Exclui medidor e leituras em cascata
  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // GET /medidores/:id/consumo - Calcula e agrupa consumo (ano, mes, dia)
  obterConsumo(id: string, filtro: ConsumoFiltro): Observable<ConsumoItem[]> {
    let params = new HttpParams().set('nivel', filtro.nivel);

    if (filtro.ano !== undefined) {
      params = params.set('ano', filtro.ano.toString());
    }

    if (filtro.mes !== undefined) {
      params = params.set('mes', filtro.mes.toString());
    }

    return this.http.get<ConsumoItem[]>(`${this.apiUrl}/${id}/consumo`, { params });
  }
}