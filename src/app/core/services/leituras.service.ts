import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Leitura } from '../models/leitura.model';
import { toIsoUtcString } from '../utils/date.utils';

@Injectable({
  providedIn: 'root'
})
export class LeiturasService {
  private readonly apiUrl = 'http://localhost:3000/leituras';

  constructor(private readonly http: HttpClient) {}

  // GET /leituras - Lista todas as leituras
  listar(): Observable<Leitura[]> {
    return this.http.get<Leitura[]>(this.apiUrl);
  }

  // GET /leituras/:id - Busca leitura por ID
  buscarPorId(id: string): Observable<Leitura> {
    return this.http.get<Leitura>(`${this.apiUrl}/${id}`);
  }

  // POST /leituras - Cadastra nova leitura (Garante data/hora em ISO 8601 UTC)
  criar(leitura: { medidorId: string; valor: number; dataHora: Date | string }): Observable<Leitura> {
    const payload = {
      ...leitura,
      dataHora: toIsoUtcString(leitura.dataHora)
    };
    return this.http.post<Leitura>(this.apiUrl, payload);
  }

  atualizar(id: string, leitura: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}`, leitura);
  }

  // DELETE /leituras/:id - Exclui uma leitura
  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}