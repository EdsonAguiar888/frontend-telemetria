

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { LeiturasService } from '../../core/services/leituras.service';
import { MedidoresService } from '../../core/services/medidores.service';
import { Leitura } from '../../core/models/leitura.model';
import { Medidor } from '../../core/models/medidor.model';

@Component({
  selector: 'app-leituras',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './leituras.component.html',
  styleUrls: ['./leituras.component.css']
})
export class LeiturasComponent implements OnInit {
  leituras: Leitura[] = [];
  leiturasFiltradas: Leitura[] = [];
  medidores: Medidor[] = [];
  filtro: string = '';

  displayedColumns: string[] = ['dataHora', 'medidor', 'valor', 'acoes'];

  novaLeitura = {
    medidorId: '',
    valor: null as number | null,
    dataHoraLocal: ''
  };

  leituraEditandoId: string | null = null;

  constructor(
    private readonly leiturasService: LeiturasService,
    private readonly medidoresService: MedidoresService,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarMedidores();
    this.carregarLeituras();
    this.definirDataHoraAtual();
  }

  carregarMedidores(): void {
    this.medidoresService.listar().subscribe({
      next: (dados) => {
        this.medidores = dados;
        this.cdr.detectChanges();
      },
      error: () => this.notificar('Erro ao carregar lista de medidores.')
    });
  }

  carregarLeituras(): void {
    this.leiturasService.listar().subscribe({
      next: (dados) => {
        this.leituras = dados;
        this.aplicarFiltro();
        this.cdr.detectChanges();
      },
      error: () => this.notificar('Erro ao carregar leituras.')
    });
  }

  definirDataHoraAtual(): void {
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    this.novaLeitura.dataHoraLocal = agora.toISOString().slice(0, 16);
  }











// Declaração das variáveis dos filtros
filtroMedidorTexto: string = '';
dataInicio: string = ''; // Formato YYYY-MM-DD
dataFim: string = '';    // Formato YYYY-MM-DD
ordemValor: 'default' | 'asc' | 'desc' = 'default';


aplicarFiltro(): void {

  // Busca geral
  const buscaGeral = (this.filtro || '').toLowerCase().trim();

  // Busca específica do medidor
  const buscaMedidor = (this.filtroMedidorTexto || '').toLowerCase().trim();


  let resultado = this.leituras.filter((leitura) => {

    // =====================================================
    // 1. BUSCA GERAL
    // Procura em qualquer informação da leitura
    // =====================================================

    const identificadorMedidor =
      this.getIdentificadorMedidor(
        leitura.medidorId,
        leitura.medidor
      ).toLowerCase();

    const valor = String(leitura.valor ?? '').toLowerCase();

    const dataHora = String(leitura.dataHora ?? '').toLowerCase();

    const textoCompleto =
      `${identificadorMedidor} ${valor} ${dataHora}`;


    const passaBuscaGeral =
      !buscaGeral ||
      textoCompleto.includes(buscaGeral);


    // =====================================================
    // 2. FILTRO ESPECÍFICO DO MEDIDOR
    // =====================================================

    const passaMedidor =
      !buscaMedidor ||
      identificadorMedidor.includes(buscaMedidor);


    // =====================================================
    // 3. FILTRO DO INTERVALO DE DATAS
    // =====================================================

    let passaData = true;

    if (leitura.dataHora) {

      const dataRegistro =
        new Date(leitura.dataHora)
          .toISOString()
          .substring(0, 10);


      if (
        this.dataInicio &&
        dataRegistro < this.dataInicio
      ) {
        passaData = false;
      }


      if (
        this.dataFim &&
        dataRegistro > this.dataFim
      ) {
        passaData = false;
      }
    }


    // =====================================================
    // 4. A LEITURA PRECISA PASSAR POR TODOS OS FILTROS
    // =====================================================

    return (
      passaBuscaGeral &&
      passaMedidor &&
      passaData
    );
  });


  // =====================================================
  // 5. ORDENAÇÃO PELO VALOR
  // =====================================================

  if (this.ordemValor === 'asc') {

    resultado.sort(
      (a, b) =>
        Number(a.valor ?? 0) -
        Number(b.valor ?? 0)
    );

  } else if (this.ordemValor === 'desc') {

    resultado.sort(
      (a, b) =>
        Number(b.valor ?? 0) -
        Number(a.valor ?? 0)
    );
  }


  // =====================================================
  // 6. ATUALIZA A TABELA
  // =====================================================

  this.leiturasFiltradas = resultado;
}







// aplicarFiltro(): void {












//   const buscaMedidor = (this.filtroMedidorTexto || '').toLowerCase().trim();

//   let resultado = this.leituras.filter((leitura) => {
    
//     // 1. Filtro do Medidor
//     const textoMedidor = this.getIdentificadorMedidor(leitura.medidorId, leitura.medidor).toLowerCase();
//     const passaMedidor = !buscaMedidor || textoMedidor.includes(buscaMedidor);

//     // 2. Filtro do Intervalo de Datas
//     let passaData = true;
//     if (leitura.dataHora) {
//       // Formata a data do registro para YYYY-MM-DD para comparação precisa de dias
//       const dataRegistro = new Date(leitura.dataHora).toISOString().substring(0, 10);

//       // Se informou 'dataInicio', a data da leitura precisa ser >= dataInicio
//       if (this.dataInicio && dataRegistro < this.dataInicio) {
//         passaData = false;
//       }

//       // Se informou 'dataFim', a data da leitura precisa ser <= dataFim
//       if (this.dataFim && dataRegistro > this.dataFim) {
//         passaData = false;
//       }
//     }

//     return passaMedidor && passaData;
//   });

//   // 3. Ordenação do Valor
//   if (this.ordemValor === 'asc') {
//     resultado.sort((a, b) => Number(a.valor ?? 0) - Number(b.valor ?? 0));
//   } else if (this.ordemValor === 'desc') {
//     resultado.sort((a, b) => Number(b.valor ?? 0) - Number(a.valor ?? 0));
//   }

//   this.leiturasFiltradas = resultado;
// }


// Variáveis de filtro
// filtroMedidorTexto: string = '';
// filtroData: string = '';
// ordemValor: 'default' | 'asc' | 'desc' = 'default';

// aplicarFiltro(): void {
//   const buscaMedidor = (this.filtroMedidorTexto || '').toLowerCase().trim();

//   let resultado = this.leituras.filter((leitura) => {
    
//     // 1. Filtro do Medidor: busca pelo identificador gerado na tabela
//     const textoMedidor = this.getIdentificadorMedidor(leitura.medidorId, leitura.medidor).toLowerCase();
//     const passaMedidor = !buscaMedidor || textoMedidor.includes(buscaMedidor);

//     // 2. Filtro de Data (Dia específico YYYY-MM-DD)
//     let passaData = true;
//     if (this.filtroData && leitura.dataHora) {
//       const dataStr = new Date(leitura.dataHora).toISOString().substring(0, 10);
//       passaData = dataStr === this.filtroData;
//     }

//     return passaMedidor && passaData;
//   });

//   // 3. Ordenação por Valor
//   if (this.ordemValor === 'asc') {
//     resultado.sort((a, b) => Number(a.valor ?? 0) - Number(b.valor ?? 0));
//   } else if (this.ordemValor === 'desc') {
//     resultado.sort((a, b) => Number(b.valor ?? 0) - Number(a.valor ?? 0));
//   }

//   this.leiturasFiltradas = resultado;
// }













  // aplicarFiltro(): void {
  //   const termo = this.filtro.toLowerCase().trim();
  //   if (!termo) {
  //     this.leiturasFiltradas = [...this.leituras];
  //     return;
  //   }
  //   this.leiturasFiltradas = this.leituras.filter((l) => {
  //     const identificador = l.medidor?.identificador?.toLowerCase() || '';
  //     const valorStr = l.valor?.toString() || '';
  //     return identificador.includes(termo) || valorStr.includes(termo);
  //   });
  // }














salvar(): void {
    if (!this.novaLeitura.medidorId || this.novaLeitura.valor === null || !this.novaLeitura.dataHoraLocal) {
      this.notificar('Preencha todos os campos do formulário.');
      return;
    }

    const payload: Omit<Leitura, 'id'> = {
      medidorId: this.novaLeitura.medidorId,
      valor: Number(this.novaLeitura.valor),
      dataHora: new Date(this.novaLeitura.dataHoraLocal).toISOString()
    };

    if (this.leituraEditandoId) {
      // Como sua API espera PATCH para atualização
      this.leiturasService.atualizar(this.leituraEditandoId, payload).subscribe({
        next: () => {
          this.notificar('Leitura atualizada com sucesso!');
          
          // O setTimeout adiaria o reset do formulário para o próximo tick do Event Loop,
          // evitando o erro ExpressionChangedAfterItHasBeenCheckedError no Angular
          setTimeout(() => {
            this.limparFormulario();
            this.carregarLeituras();
          });
        },
        error: () => this.notificar('Erro ao atualizar leitura.')
      });
    } else {
      this.leiturasService.criar(payload).subscribe({
        next: () => {
          this.notificar('Leitura registrada com sucesso!');
          
          setTimeout(() => {
            this.limparFormulario();
            this.carregarLeituras();
          });
        },
        error: () => this.notificar('Erro ao registrar leitura.')
      });
    }
  }


//   salvar(): void {
//     if (!this.novaLeitura.medidorId || this.novaLeitura.valor === null || !this.novaLeitura.dataHoraLocal) {
//       this.notificar('Preencha todos os campos do formulário.');
//       return;
//     }

//     const payload: Omit<Leitura, 'id'> = {
//       medidorId: this.novaLeitura.medidorId,
//       valor: Number(this.novaLeitura.valor),
//       dataHora: new Date(this.novaLeitura.dataHoraLocal).toISOString()
//     };

//     if (this.leituraEditandoId) {
//       this.leiturasService.atualizar(this.leituraEditandoId, payload).subscribe({
//         next: () => {
//           this.notificar('Leitura atualizada com sucesso!');
//           this.limparFormulario();
//           this.carregarLeituras();
//         },
//         error: () => this.notificar('Erro ao atualizar leitura.')
//       });
//     } else {
//       this.leiturasService.criar(payload).subscribe({
//         next: () => {
//           this.notificar('Leitura registrada com sucesso!');
//           this.limparFormulario();
//           this.carregarLeituras();
//         },
//         error: () => this.notificar('Erro ao registrar leitura.')
//       });
//     }
//   }



















// Adicione/Atualize estes dois métodos no leituras.component.ts

editar(leitura: Leitura): void {
  this.leituraEditandoId = leitura.id ?? null;

  // Extrai o ID do medidor seja ele uma string simples ou um objeto populado do NestJS
  const medidorIdEncontrado = typeof leitura.medidorId === 'string'
    ? leitura.medidorId
    : (leitura.medidor as any)?.id || (leitura.medidorId as any)?.id || '';

  // Converte a data da leitura para o formato do input datetime-local
  const data = new Date(leitura.dataHora);
  data.setMinutes(data.getMinutes() - data.getTimezoneOffset());

  this.novaLeitura = {
    medidorId: medidorIdEncontrado,
    valor: leitura.valor,
    dataHoraLocal: data.toISOString().slice(0, 16)
  };
}

// Função de comparação para o mat-select reconhecer o medidor selecionado
compararMedidores(o1: any, o2: any): boolean {
  if (!o1 || !o2) return false;
  const id1 = typeof o1 === 'object' ? o1.id : o1;
  const id2 = typeof o2 === 'object' ? o2.id : o2;
  return id1 === id2;
}

//   editar(leitura: Leitura): void {
//     this.leituraEditandoId = leitura.id ?? null;
    
//     // Converte a data da leitura para o formato aceito pelo input datetime-local
//     const data = new Date(leitura.dataHora);
//     data.setMinutes(data.getMinutes() - data.getTimezoneOffset());
    
//     this.novaLeitura = {
//       medidorId: leitura.medidorId,
//       valor: leitura.valor,
//       dataHoraLocal: data.toISOString().slice(0, 16)
//     };
//   }












  excluir(id: string): void {
    if (confirm('Deseja realmente excluir esta leitura?')) {
      this.leiturasService.excluir(id).subscribe({
        next: () => {
          this.notificar('Leitura excluída com sucesso!');
          this.carregarLeituras();
        },
        error: () => this.notificar('Erro ao excluir leitura.')
      });
    }
  }

  limparFormulario(): void {
    this.leituraEditandoId = null;
    this.novaLeitura = {
      medidorId: '',
      valor: null,
      dataHoraLocal: ''
    };
    this.definirDataHoraAtual();
  }

  getIdentificadorMedidor(medidorId: string, medidorObjeto?: Medidor): string {
    if (medidorObjeto?.identificador) {
      return medidorObjeto.identificador;
    }
    const encontrado = this.medidores.find((m) => m.id === imovelIdEncontrado(medidorId));
    return encontrado ? encontrado.identificador : 'Medidor não identificado';
  }

  private notificar(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
  }
}

function imovelIdEncontrado(id: string): string {
  return id;
}




































// import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatTableModule } from '@angular/material/table';
// import { MatCardModule } from '@angular/material/card';
// import { MatInputModule } from '@angular/material/input';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatSelectModule } from '@angular/material/select';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

// import { LeiturasService } from '../../core/services/leituras.service';
// import { MedidoresService } from '../../core/services/medidores.service';
// import { Leitura } from '../../core/models/leitura.model';
// import { Medidor } from '../../core/models/medidor.model';

// @Component({
//   selector: 'app-leituras',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatTableModule,
//     MatCardModule,
//     MatInputModule,
//     MatFormFieldModule,
//     MatSelectModule,
//     MatButtonModule,
//     MatIconModule,
//     MatSnackBarModule
//   ],
//   templateUrl: './leituras.component.html',
//   styleUrls: ['./leituras.component.css']
// })
// export class LeiturasComponent implements OnInit {
//   leituras: Leitura[] = [];
//   leiturasFiltradas: Leitura[] = [];
//   medidores: Medidor[] = [];
//   filtro: string = '';

//   displayedColumns: string[] = ['dataHora', 'medidor', 'valor', 'acoes'];

//   novaLeitura = {
//     medidorId: '',
//     valor: null as number | null,
//     dataHoraLocal: ''
//   };

//   constructor(
//     private readonly leiturasService: LeiturasService,
//     private readonly medidoresService: MedidoresService,
//     private readonly snackBar: MatSnackBar,
//     private readonly cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit(): void {
//     this.carregarMedidores();
//     this.carregarLeituras();
//     this.definirDataHoraAtual();
//   }

//   carregarMedidores(): void {
//     this.medidoresService.listar().subscribe({
//       next: (dados) => {
//         this.medidores = dados;
//         this.cdr.detectChanges();
//       },
//       error: () => this.notificar('Erro ao carregar lista de medidores.')
//     });
//   }

//   carregarLeituras(): void {
//     this.leiturasService.listar().subscribe({
//       next: (dados) => {
//         this.leituras = dados;
//         this.aplicarFiltro();
//         this.cdr.detectChanges();
//       },
//       error: () => this.notificar('Erro ao carregar leituras.')
//     });
//   }

//   definirDataHoraAtual(): void {
//     const agora = new Date();
//     agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
//     this.novaLeitura.dataHoraLocal = agora.toISOString().slice(0, 16);
//   }

//   aplicarFiltro(): void {
//     const termo = this.filtro.toLowerCase().trim();
//     if (!termo) {
//       this.leiturasFiltradas = [...this.leituras];
//       return;
//     }
//     this.leiturasFiltradas = this.leituras.filter((l) => {
//       const identificador = l.medidor?.identificador?.toLowerCase() || '';
//       const valorStr = l.valor?.toString() || '';
//       return identificador.includes(termo) || valorStr.includes(termo);
//     });
//   }

//   salvar(): void {
//     if (!this.novaLeitura.medidorId || this.novaLeitura.valor === null || !this.novaLeitura.dataHoraLocal) {
//       this.notificar('Preencha todos os campos do formulário.');
//       return;
//     }

//     const payload: Omit<Leitura, 'id'> = {
//       medidorId: this.novaLeitura.medidorId,
//       valor: Number(this.novaLeitura.valor),
//       dataHora: new Date(this.novaLeitura.dataHoraLocal).toISOString()
//     };

//     this.leiturasService.criar(payload).subscribe({
//       next: () => {
//         this.notificar('Leitura registrada com sucesso!');
//         this.limparFormulario();
//         this.carregarLeituras();
//       },
//       error: () => this.notificar('Erro ao registrar leitura.')
//     });
//   }

//   excluir(id: string): void {
//     if (confirm('Deseja realmente excluir esta leitura?')) {
//       this.leiturasService.excluir(id).subscribe({
//         next: () => {
//           this.notificar('Leitura excluída com sucesso!');
//           this.carregarLeituras();
//         },
//         error: () => this.notificar('Erro ao excluir leitura.')
//       });
//     }
//   }

//   limparFormulario(): void {
//     this.novaLeitura = {
//       medidorId: '',
//       valor: null,
//       dataHoraLocal: ''
//     };
//     this.definirDataHoraAtual();
//   }

//   getIdentificadorMedidor(medidorId: string, medidorObjeto?: Medidor): string {
//     if (medidorObjeto?.identificador) {
//       return medidorObjeto.identificador;
//     }
//     const encontrado = this.medidores.find((m) => m.id === medidorId);
//     return encontrado ? encontrado.identificador : 'Medidor não identificado';
//   }

//   private notificar(mensagem: string): void {
//     this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
//   }
// }