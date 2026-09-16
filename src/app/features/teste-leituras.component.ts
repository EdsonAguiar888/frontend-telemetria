import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeiturasService } from '../core/services/leituras.service';
import { MedidoresService } from '../core/services/medidores.service';
import { ImoveisService } from '../core/services/imoveis.service';
import { TipoMedidor } from '../core/models/medidor.model';

@Component({
  selector: 'app-teste-leituras',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2>🧪 Teste de Integração: LeiturasService</h2>
      <p>Abra o <strong>Console do DevTools (F12)</strong> para acompanhar a execução.</p>
      <button (click)="executarBateriaDeTestes()" style="padding: 10px 15px; cursor: pointer;">
        Roda Bateria de Testes de Leituras
      </button>
    </div>
  `
})
export class TesteLeiturasComponent implements OnInit {
  constructor(
    private readonly leiturasService: LeiturasService,
    private readonly medidoresService: MedidoresService,
    private readonly imoveisService: ImoveisService
  ) {}

  ngOnInit(): void {
    console.log('--- [TesteLeiturasComponent] Inicializado. ---');
  }

  executarBateriaDeTestes(): void {
    console.log('🚀 Iniciando bateria de testes no endpoint /leituras...');

    // 1. Criar Imóvel
    this.imoveisService.criar({ nome: 'Imóvel Teste Leitura', endereco: 'Rua Leitura, 100' }).subscribe({
      next: (imovel) => {
        const imovelId = imovel.id!;

        // 2. Criar Medidor
        this.medidoresService.criar({ identificador: 'MED-LEITURA-01', tipo: TipoMedidor.ENERGIA, imovelId }).subscribe({
          next: (medidor) => {
            const medidorId = medidor.id!;

            // 3. POST /leituras - Criar leitura enviando Date (será convertido para ISO 8601 UTC)
            const novaLeitura = {
              medidorId,
              valor: 150.75,
              dataHora: new Date()
            };

            this.leiturasService.criar(novaLeitura).subscribe({
              next: (created) => {
                console.log('✅ [POST /leituras] Sucesso (Payload UTC enviado):', created);
                const leituraId = created.id!;

                // 4. GET /leituras - Listar leituras
                this.leiturasService.listar().subscribe({
                  next: (lista) => {
                    console.log('✅ [GET /leituras] Sucesso (Total):', lista.length, lista);

                    // 5. GET /leituras/:id - Buscar leitura por ID
                    this.leiturasService.buscarPorId(leituraId).subscribe({
                      next: (buscada) => {
                        console.log('✅ [GET /leituras/:id] Sucesso:', buscada);

                        // 6. Limpeza: Excluir Leitura, Medidor e Imóvel
                        this.leiturasService.excluir(leituraId).subscribe({
                          next: () => {
                            console.log('✅ [DELETE /leituras/:id] Sucesso!');
                            this.medidoresService.excluir(medidorId).subscribe({
                              next: () => {
                                this.imoveisService.excluir(imovelId).subscribe({
                                  next: () => {
                                    console.log('✅ [Limpeza] Dados temporários excluídos com sucesso!');
                                    console.log('🎉 Todos os testes do LeiturasService foram concluídos com sucesso!');
                                  }
                                });
                              }
                            });
                          }
                        });
                      },
                      error: (err) => console.error('❌ [GET /leituras/:id] Erro:', err)
                    });
                  },
                  error: (err) => console.error('❌ [GET /leituras] Erro:', err)
                });
              },
              error: (err) => console.error('❌ [POST /leituras] Erro:', err)
            });
          },
          error: (err) => console.error('❌ Erro ao criar medidor:', err)
        });
      },
      error: (err) => console.error('❌ Erro ao criar imóvel:', err)
    });
  }
}