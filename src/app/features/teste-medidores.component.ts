import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedidoresService } from '../core/services/medidores.service';
import { ImoveisService } from '../core/services/imoveis.service';
import { TipoMedidor } from '../core/models/medidor.model';

@Component({
  selector: 'app-teste-medidores',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2>🧪 Teste de Integração: MedidoresService</h2>
      <p>Abra o <strong>Console do DevTools (F12)</strong> para acompanhar a execução.</p>
      <button (click)="executarBateriaDeTestes()" style="padding: 10px 15px; cursor: pointer;">
        Roda Bateria de Testes dos Medidores
      </button>
    </div>
  `
})
export class TesteMedidoresComponent implements OnInit {
  constructor(
    private readonly medidoresService: MedidoresService,
    private readonly imoveisService: ImoveisService
  ) {}

  ngOnInit(): void {
    console.log('--- [TesteMedidoresComponent] Inicializado. ---');
  }

  executarBateriaDeTestes(): void {
    console.log('🚀 Iniciando bateria de testes no endpoint /medidores...');

    // 1. Criar um imóvel base para o medidor
    this.imoveisService.criar({ nome: 'Imóvel para Teste Medidor', endereco: 'Rua Teste, 999' }).subscribe({
      next: (imovel) => {
        console.log('✅ [Pré-requisito] Imóvel criado com ID:', imovel.id);
        const imovelId = imovel.id!;

        // 2. POST /medidores - Cadastrar medidor
        const novoMedidor = {
          identificador: 'MED-AGUA-TESTE',
          tipo: TipoMedidor.AGUA,
          imovelId: imovelId
        };

        this.medidoresService.criar(novoMedidor).subscribe({
          next: (created) => {
            console.log('✅ [POST /medidores] Sucesso:', created);
            const medidorId = created.id!;

            // 3. GET /medidores - Listar medidores
            this.medidoresService.listar().subscribe({
              next: (lista) => {
                console.log('✅ [GET /medidores] Sucesso (Total):', lista.length, lista);

                // 4. GET /medidores/:id - Buscar por ID
                this.medidoresService.buscarPorId(medidorId).subscribe({
                  next: (buscado) => {
                    console.log('✅ [GET /medidores/:id] Sucesso:', buscado);

                    // 5. PATCH /medidores/:id - Atualizar medidor
                    this.medidoresService.atualizar(medidorId, { identificador: 'MED-AGUA-REV' }).subscribe({
                      next: (atualizado) => {
                        console.log('✅ [PATCH /medidores/:id] Sucesso:', atualizado);

                        // 6. GET /medidores/:id/consumo - Testar rota de consumo agregada
                        this.medidoresService.obterConsumo(medidorId, { nivel: 'ano' }).subscribe({
                          next: (consumo) => {
                            console.log('✅ [GET /medidores/:id/consumo] Sucesso:', consumo);

                            // 7. Limpeza: Excluir Medidor e Imóvel
                            this.medidoresService.excluir(medidorId).subscribe({
                              next: () => {
                                console.log('✅ [DELETE /medidores/:id] Sucesso!');
                                this.imoveisService.excluir(imovelId).subscribe({
                                  next: () => {
                                    console.log('✅ [Limpeza] Imóvel excluído!');
                                    console.log('🎉 Todos os testes do MedidoresService foram concluídos com sucesso!');
                                  }
                                });
                              }
                            });
                          },
                          error: (err) => console.error('❌ [GET /medidores/:id/consumo] Erro:', err)
                        });
                      },
                      error: (err) => console.error('❌ [PATCH /medidores/:id] Erro:', err)
                    });
                  },
                  error: (err) => console.error('❌ [GET /medidores/:id] Erro:', err)
                });
              },
              error: (err) => console.error('❌ [GET /medidores] Erro:', err)
            });
          },
          error: (err) => console.error('❌ [POST /medidores] Erro:', err)
        });
      },
      error: (err) => console.error('❌ [Pré-requisito] Erro ao criar imóvel:', err)
    });
  }
}