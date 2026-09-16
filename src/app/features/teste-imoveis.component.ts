import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImoveisService } from '../core/services/imoveis.service';
import { Imovel } from '../core/models/imovel.model';

@Component({
  selector: 'app-teste-imoveis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; font-family: sans-serif;">
      <h2>🧪 Teste de Integração: ImoveisService</h2>
      <p>Abra o <strong>Console do DevTools (F12)</strong> para acompanhar a execução dos testes.</p>
      <button (click)="executarBateriaDeTestes()" style="padding: 10px 15px; cursor: pointer;">
        Roda Bateria de Testes
      </button>
    </div>
  `
})
export class TesteImoveisComponent implements OnInit {
  constructor(private readonly imoveisService: ImoveisService) {}

  ngOnInit(): void {
    console.log('--- [TesteImoveisComponent] Inicializado. Clique no botão para testar a API. ---');
  }

  executarBateriaDeTestes(): void {
    console.log('🚀 Iniciando bateria de testes no endpoint /imoveis...');

    // 1. POST /imoveis - Cadastrar um imóvel de teste
    const novoImovel: Omit<Imovel, 'id'> = {
      nome: 'Imóvel de Teste Angular',
      endereco: 'Rua do Teste, 123 - Recife/PE'
    };

    this.imoveisService.criar(novoImovel).subscribe({
      next: (created) => {
        console.log('✅ [POST /imoveis] Sucesso:', created);
        const idCriado = created.id!;

        // 2. GET /imoveis - Listar todos os imóveis
        this.imoveisService.listar().subscribe({
          next: (lista) => {
            console.log('✅ [GET /imoveis] Sucesso (Total):', lista.length, lista);

            // 3. GET /imoveis/:id - Buscar imóvel cadastrado por ID
            this.imoveisService.buscarPorId(idCriado).subscribe({
              next: (buscado) => {
                console.log('✅ [GET /imoveis/:id] Sucesso:', buscado);

                // 4. PATCH /imoveis/:id - Atualizar imóvel
                this.imoveisService.atualizar(idCriado, { nome: 'Imóvel de Teste (Atualizado)' }).subscribe({
                  next: (atualizado) => {
                    console.log('✅ [PATCH /imoveis/:id] Sucesso:', atualizado);

                    // 5. DELETE /imoveis/:id - Remover imóvel
                    this.imoveisService.excluir(idCriado).subscribe({
                      next: () => {
                        console.log('✅ [DELETE /imoveis/:id] Sucesso! Imóvel excluído.');
                        console.log('🎉 Todos os testes do ImoveisService foram concluídos com sucesso!');
                      },
                      error: (err) => console.error('❌ [DELETE /imoveis/:id] Erro:', err)
                    });
                  },
                  error: (err) => console.error('❌ [PATCH /imoveis/:id] Erro:', err)
                });
              },
              error: (err) => console.error('❌ [GET /imoveis/:id] Erro:', err)
            });
          },
          error: (err) => console.error('❌ [GET /imoveis] Erro:', err)
        });
      },
      error: (err) => console.error('❌ [POST /imoveis] Erro:', err)
    });
  }
}