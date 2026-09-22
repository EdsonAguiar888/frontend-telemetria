

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

import { DashboardService, Imovel, Leitura, Medidor } from '../../core/services/dashboard.service';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // IMÓVEIS
  imoveis: Imovel[] = [];
  imovelSelecionadoId: string = '';
  medidoresDoImovel: Medidor[] = [];
  leiturasDoImovel: Leitura[] = [];

  // PERÍODO
  anoAtual: number = 2026;
  mesAtual: number = 9;
  filtroVisao: 'ANO' | 'MES' | 'DIA' = 'MES';
  mesSelecionado: number | null = null;
  diaSelecionado: number | null = null;

  // CONTROLE DA TELA
  carregando: boolean = false;
  tituloGrafico: string = 'Consumo mensal';

  // KPIs
  kpis = {
    agua: { valor: '0,00', variacao: 0 },
    energia: { valor: '0,00', variacao: 0 },
    gas: { valor: '0,00', variacao: 0 }
  };

  // TABELA
  leiturasDetalhadas: Array<{
    data: string;
    hora: string;
    leitura: number;
    consumo: number;
    tipo: string;
  }> = [];

  // GRÁFICO
  chartOptions: ApexOptions = {
    series: [],
    chart: {
      type: 'bar',
      height: 280,
      toolbar: { show: false },
      background: 'transparent'
    },
    xaxis: { categories: [] },
    theme: { mode: 'dark' }
  };

  // CONSTRUTOR
  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}

  // INICIALIZAÇÃO
  ngOnInit(): void {
    console.log('DASHBOARD INICIOU');
    this.carregarImoveis();
  }

  // CARREGAR IMÓVEIS
  carregarImoveis(): void {
    console.log('1. Chamando API de imóveis...');

    this.dashboardService.getImoveis().subscribe({
      next: (dados) => {
        console.log('2. Imóveis recebidos:', dados);
        this.imoveis = dados || [];

        if (this.imoveis.length > 0) {
          this.imovelSelecionadoId = String(this.imoveis[0].id);
          console.log('3. Imóvel selecionado:', this.imovelSelecionadoId);
          this.carregarDadosDoImovel();
        } else {
          console.log('3. NENHUM IMÓVEL ENCONTRADO');
        }
      },
      error: (err) => console.error('ERRO AO BUSCAR IMÓVEIS:', err)
    });
  }

  // CARREGAR DADOS DO IMÓVEL
  carregarDadosDoImovel(): void {
    console.log('IMÓVEL SELECIONADO:', this.imovelSelecionadoId);

    if (!this.imovelSelecionadoId) return;

    this.carregando = true;
    this.filtroVisao = 'MES';
    this.mesSelecionado = null;
    this.diaSelecionado = null;
    this.tituloGrafico = 'Consumo mensal';

    this.dashboardService.getMedidores().pipe(
      switchMap((todosMedidores: Medidor[]) => {
        console.log('TODOS OS MEDIDORES:', todosMedidores);

        this.medidoresDoImovel = (todosMedidores || []).filter(
          (m) => String(m.imovel?.id) === String(this.imovelSelecionadoId)
        );

        console.log('MEDIDORES DO IMÓVEL SELECIONADO:', this.medidoresDoImovel);

        return forkJoin({ leituras: this.dashboardService.getLeituras() });
      })
    ).subscribe({
      next: ({ leituras }) => {
        console.log('LEITURAS BRUTAS DA API:', leituras);
        console.log('PRIMEIRA LEITURA:', leituras?.[0]);
        console.log('MEDIDORES DO IMÓVEL:', this.medidoresDoImovel);

        const idsMedidores = new Set(this.medidoresDoImovel.map((m) => String(m.id)));

        this.leiturasDoImovel = (leituras || [])
          .filter((l) => idsMedidores.has(String(l.medidor?.id)))
          .map((l) => {
            const idMedidorLeitura = l.medidor?.id;

            return {
              ...l,
              medidor: this.medidoresDoImovel.find(
                (m) => String(m.id) === String(idMedidorLeitura)
              )
            };
          });

        const leiturasDoImovel = (leituras || [])
          .filter((l) => idsMedidores.has(String(l.medidor?.id)))
          .map((l) => ({
            ...l,
            medidor: this.medidoresDoImovel.find(
              (m) => String(m.id) === String(l.medidor?.id)
            )
          }));

        console.log('LEITURAS DO IMÓVEL:', leiturasDoImovel);
        console.log('CHAMANDO PROCESSAR KPIs');
        this.processarKPIs(leiturasDoImovel);

        console.log('CHAMANDO PROCESSAR TABELA');
        this.processarTabelaDetalhada(leiturasDoImovel);

        this.carregarConsumoGrafico();
      },
      error: (err) => {
        console.error('Erro ao carregar dados:', err);
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ALTERAR VISÃO
  alterarVisao(tipo: 'ANO' | 'MES' | 'DIA'): void {
    console.log('Alterando visão para:', tipo);
    this.filtroVisao = tipo;

    if (tipo === 'MES') {
      this.mesSelecionado = null;
      this.diaSelecionado = null;
      this.tituloGrafico = 'Consumo mensal';
      this.carregarConsumoGrafico();
      return;
    }

    if (tipo === 'DIA') {
      if (!this.mesSelecionado) this.mesSelecionado = this.mesAtual;

      this.diaSelecionado = null;
      this.tituloGrafico = `Consumo diário - ${this.obterNomeMes(this.mesSelecionado)}`;
      this.carregarConsumoGrafico();
      this.carregarLeiturasDoMes(this.mesSelecionado);
      return;
    }

    if (tipo === 'ANO') {
      this.mesSelecionado = null;
      this.diaSelecionado = null;
      this.tituloGrafico = `Consumo anual - ${this.anoAtual}`;
      this.carregarConsumoGrafico();
    }
  }

  // CLIQUE NO ANO
  selecionarAno(ano: number): void {
    console.log('ANO SELECIONADO:', ano);

    this.anoAtual = ano;
    this.mesSelecionado = null;
    this.diaSelecionado = null;
    this.filtroVisao = 'MES';
    this.tituloGrafico = `Consumo mensal - ${ano}`;
    this.carregarConsumoGrafico();
  }

  // CLIQUE NO MÊS
  selecionarMes(mes: number): void {
    console.log('MÊS SELECIONADO:', mes);

    this.mesSelecionado = mes;
    this.diaSelecionado = null;
    this.filtroVisao = 'DIA';
    this.tituloGrafico = `Consumo diário - ${this.obterNomeMes(mes)}`;

    this.carregarConsumoGrafico();
    this.carregarLeiturasDoMes(mes);
  }

  // CLIQUE NO DIA
  selecionarDia(dia: number): void {
    console.log('DIA SELECIONADO:', dia);

    if (!this.mesSelecionado) {
      console.warn('Nenhum mês selecionado.');
      return;
    }

    this.diaSelecionado = dia;
    this.tituloGrafico = `Leituras do dia ${dia}/${this.mesSelecionado}/${this.anoAtual}`;
    this.carregarLeiturasDoDia(dia);
  }

  // CARREGAR GRÁFICO
  private carregarConsumoGrafico(): void {
    if (this.medidoresDoImovel.length === 0) {
      this.montarGraficoVazio();
      this.carregando = false;
      this.cdr.detectChanges();
      return;
    }

    const nivel = this.filtroVisao.toLowerCase() as 'dia' | 'mes' | 'ano';
    const mesParaConsulta = this.mesSelecionado ?? this.mesAtual;

    console.log('NÍVEL DA CONSULTA:', nivel);
    console.log('ANO:', this.anoAtual);
    console.log('MÊS:', mesParaConsulta);

    const requisicoes = this.medidoresDoImovel.map((medidor) =>
      this.dashboardService.getConsumoMedidor(
        medidor.id,
        nivel,
        this.anoAtual,
        mesParaConsulta
      )
    );

    forkJoin(requisicoes).subscribe({
      next: (resultadosConsumo) => {
        console.log('===== RESULTADO DO CONSUMO =====');
        console.log(resultadosConsumo);
        console.log('QUANTIDADE DE RESULTADOS:', resultadosConsumo.length);

        this.montarGraficoMultiplasSeries(resultadosConsumo);
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar consumo:', err);
        this.montarGraficoVazio();
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // MONTAR GRÁFICO
  private montarGraficoMultiplasSeries(resultadosConsumo: any[][]): void {
    const categorias = this.obterCategoriasPorFiltro();

    const coresTipos: Record<string, string> = {
      AGUA: '#0ea5e9',
      ENERGIA: '#f59e0b',
      GAS: '#ef4444'
    };

    const series = this.medidoresDoImovel.map((medidor, idx) => {
      const consumoArray = resultadosConsumo[idx] || [];

      const dadosMapeados = categorias.map((_, index) => {
        const itemEncontrado = consumoArray.find((c) => {

          if (this.filtroVisao === 'ANO') {
            const anoItem = c.ano ?? c.periodo ?? c.name ?? (
              c.data ? new Date(c.data).getFullYear() : null
            );

            return Number(anoItem) === Number(categorias[index]);
          }

          if (this.filtroVisao === 'MES') {
            const mesItem = c.mes ?? c.periodo ?? c.name ?? (
              c.data ? new Date(c.data).getMonth() + 1 : null
            );

            return Number(mesItem) === index + 1;
          }

          if (this.filtroVisao === 'DIA') {
            const diaItem = c.dia ?? c.periodo ?? c.name ?? (
              c.data ? new Date(c.data).getDate() : null
            );

            return Number(diaItem) === index + 1;
          }

          return true;
        });

        if (!itemEncontrado) return 0;

        const valor = itemEncontrado.value ??
          itemEncontrado.totalConsumo ??
          itemEncontrado.consumo ??
          itemEncontrado.valor ??
          itemEncontrado.total ??
          0;

        return Number(valor);
      });

      return {
        name: medidor.tipo || `Medidor ${idx + 1}`,
        data: dadosMapeados,
        color: coresTipos[medidor.tipo] || '#0ea5e9'
      };
    });

    console.log('CATEGORIAS:', categorias);
    console.log('SERIES GERADAS:', series);

    this.chartOptions = {
      series: [...series],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        background: 'transparent',
        events: {
          dataPointSelection: (event, chartContext, config) => {
            if (!config) return;

            const index = config.dataPointIndex;
            console.log('COLUNA CLICADA:', index);

            if (this.filtroVisao === 'ANO') {
              const categorias = this.obterCategoriasPorFiltro();
              const ano = Number(categorias[index]);

              console.log('COLUNA CLICADA:', index);
              console.log('ANO CLICADO:', ano);

              this.selecionarAno(ano);
              return;
            }

            if (this.filtroVisao === 'MES') {
              const mes = index + 1;
              console.log('MÊS CLICADO:', mes);
              this.selecionarMes(mes);
            } else if (this.filtroVisao === 'DIA') {
              const dia = index + 1;
              console.log('DIA CLICADO:', dia);
              this.selecionarDia(dia);
            }
          }
        }
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
          borderRadius: 4,
          distributed: false
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: [...categorias],
        labels: { style: { colors: '#94a3b8' } }
      },
      grid: { borderColor: 'rgba(255, 255, 255, 0.05)' },
      theme: { mode: 'dark' }
    };
  }

  // CATEGORIAS DO GRÁFICO
  obterCategoriasPorFiltro(): string[] {
    if (this.filtroVisao === 'ANO') {
      const anos = this.obterAnosDisponiveis();
      console.log('ANOS DISPONÍVEIS:', anos);
      return anos.map((ano) => String(ano));
    }

    if (this.filtroVisao === 'MES') {
      return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    }

    if (this.filtroVisao === 'DIA') {
      const mes = this.mesSelecionado ?? this.mesAtual;
      const quantidadeDias = new Date(this.anoAtual, mes, 0).getDate();
      return Array.from({ length: quantidadeDias }, (_, i) => `${i + 1}`);
    }

    return [];
  }

  // NOME DO MÊS
  private obterNomeMes(mes: number): string {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[mes - 1] || '';
  }

  obterNomeMesPublico(): string {
    if (!this.mesSelecionado) return this.obterNomeMes(this.mesAtual);
    return this.obterNomeMes(this.mesSelecionado);
  }

  obterAnosDisponiveis(): number[] {
    const anos = this.leiturasDoImovel.map((leitura) => new Date(leitura.dataHora).getFullYear());
    return [...new Set(anos)].sort((a, b) => a - b);
  }

  // CARREGAR LEITURAS DO MÊS
  private carregarLeiturasDoMes(mes: number): void {
    console.log('CARREGANDO LEITURAS DO MÊS:', mes);

    this.dashboardService.getLeituras().subscribe({
      next: (leituras) => {
        const idsMedidores = new Set(this.medidoresDoImovel.map((m) => String(m.id)));

        const leiturasDoMes = (leituras || [])
          .filter((l) => {
            const idMedidorLeitura = l.medidor?.id;
            return idsMedidores.has(String(idMedidorLeitura));
          })
          .map((l) => {
            const idMedidorLeitura = l.medidor?.id;

            return {
              ...l,
              medidor: this.medidoresDoImovel.find(
                (m) => String(m.id) === String(idMedidorLeitura)
              )
            };
          })
          .filter((l) => {
            const data = new Date(l.dataHora);

            return data.getFullYear() === this.anoAtual &&
              data.getMonth() + 1 === mes;
          });

        console.log('LEITURAS DO MÊS:', leiturasDoMes);
        console.log('QUANTIDADE DE LEITURAS DO MÊS:', leiturasDoMes.length);

        this.processarTabelaDetalhada(leiturasDoMes);
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERRO AO CARREGAR LEITURAS DO MÊS:', err);
        this.leiturasDetalhadas = [];
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // CARREGAR LEITURAS DO DIA
  private carregarLeiturasDoDia(dia: number): void {
    if (!this.mesSelecionado) return;

    this.carregando = true;

    this.dashboardService.getLeituras().subscribe({
      next: (leituras) => {
        const idsMedidores = new Set(this.medidoresDoImovel.map((m) => String(m.id)));

        const leiturasDoDia = (leituras || [])
          .filter((l) => {
            const idMedidorLeitura = l.medidor?.id;
            return idsMedidores.has(String(idMedidorLeitura));
          })
          .map((l) => {
            const idMedidorLeitura = l.medidor?.id;

            return {
              ...l,
              medidor: this.medidoresDoImovel.find(
                (m) => String(m.id) === String(idMedidorLeitura)
              )
            };
          })
          .filter((l) => {
            const data = new Date(l.dataHora);
            return data.getFullYear() === this.anoAtual;
          })
          .filter((l) => {
            const data = new Date(l.dataHora);
            return data.getMonth() + 1 === this.mesSelecionado;
          })
          .filter((l) => {
            const data = new Date(l.dataHora);
            return data.getDate() === dia;
          });

        console.log('LEITURAS DO DIA:', leiturasDoDia);
        console.log('QUANTIDADE DE LEITURAS DO DIA:', leiturasDoDia.length);

        this.processarTabelaDetalhada(leiturasDoDia);
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERRO AO CARREGAR LEITURAS DO DIA:', err);
        this.leiturasDetalhadas = [];
        this.carregando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // PROCESSAR KPIs
  private processarKPIs(leituras: Leitura[]): void {
    console.log('==============================');
    console.log('PROCESSANDO KPIs');
    console.log('LEITURAS RECEBIDAS:', leituras);
    console.log('QUANTIDADE:', leituras.length);
    console.log('==============================');

    const leiturasDoAno = leituras.filter((l) => new Date(l.dataHora).getFullYear() === this.anoAtual);

    let totalAgua = 0;
    let totalEnergia = 0;
    let totalGas = 0;

    this.medidoresDoImovel.forEach((medidor) => {
      const leiturasMedidor = leiturasDoAno
        .filter((l) => l.medidor?.id === medidor.id)
        .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());

      for (let i = 1; i < leiturasMedidor.length; i++) {
        const atual = Number(leiturasMedidor[i].valor);
        const anterior = Number(leiturasMedidor[i - 1].valor);
        const consumo = atual - anterior;

        if (consumo < 0) continue;

        if (medidor.tipo === 'AGUA') totalAgua += consumo;
        if (medidor.tipo === 'ENERGIA') totalEnergia += consumo;
        if (medidor.tipo === 'GAS') totalGas += consumo;
      }
    });

    this.kpis = {
      agua: { valor: totalAgua.toFixed(2).replace('.', ','), variacao: 0 },
      energia: { valor: totalEnergia.toFixed(2).replace('.', ','), variacao: 0 },
      gas: { valor: totalGas.toFixed(2).replace('.', ','), variacao: 0 }
    };

    console.log('==============================');
    console.log('PROCESSANDO KPIs');
    console.log('LEITURAS RECEBIDAS:', leituras);
    console.log('QUANTIDADE:', leituras.length);
    console.log('==============================');
  }

  // PROCESSAR TABELA
  private processarTabelaDetalhada(leituras: Leitura[]): void {
    console.log('================================');
    console.log('PROCESSANDO TABELA');
    console.log('LEITURAS RECEBIDAS:', leituras);
    console.log('QUANTIDADE:', leituras.length);
    console.log('================================');

    const ordenadas = [...leituras].sort(
      (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
    );

    this.leiturasDetalhadas = ordenadas.slice(0, 10).map((l, idx) => {
      const dataObj = new Date(l.dataHora);

      const anterior = ordenadas.find(
        (item, itemIdx) => itemIdx > idx && String(item.medidor?.id) === String(l.medidor?.id)
      );

      const consumoCalculado = anterior ? Number(l.valor) - Number(anterior.valor) : 0;

      const leituraFormatada = {
        data: isNaN(dataObj.getTime()) ? '-' : dataObj.toLocaleDateString('pt-BR'),
        hora: isNaN(dataObj.getTime()) ? '-' : dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        leitura: Number(l.valor) || 0,
        consumo: Number(consumoCalculado.toFixed(2)),
        tipo: l.medidor?.tipo || 'N/A'
      };

      console.log('LINHA GERADA:', leituraFormatada);
      return leituraFormatada;
    });

    console.log('================================');
    console.log('LEITURAS DETALHADAS:', this.leiturasDetalhadas);
    console.log('QUANTIDADE NA TABELA:', this.leiturasDetalhadas.length);
    console.log('================================');
  }

  // GRÁFICO VAZIO
  private montarGraficoVazio(): void {
    this.chartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        background: 'transparent'
      },
      xaxis: { categories: this.obterCategoriasPorFiltro() },
      theme: { mode: 'dark' }
    };
  }
}























































// import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

// import {
//   DashboardService,
//   Imovel,
//   Leitura,
//   Medidor
// } from '../../core/services/dashboard.service';

// import { forkJoin } from 'rxjs';
// import { switchMap } from 'rxjs/operators';

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatIconModule,
//     MatButtonModule,
//     NgApexchartsModule
//   ],
//   templateUrl: './dashboard.component.html',
//   styleUrls: ['./dashboard.component.css']
// })
// export class DashboardComponent implements OnInit {

//   // ============================================================
//   // IMÓVEIS
//   // ============================================================

//   imoveis: Imovel[] = [];
//   imovelSelecionadoId: string = '';
//   medidoresDoImovel: Medidor[] = [];
//   leiturasDoImovel: Leitura[] = [];


//   // ============================================================
//   // PERÍODO
//   // ============================================================

//   anoAtual: number = 2026;

//   mesAtual: number = 9;

//   filtroVisao: 'ANO' | 'MES' | 'DIA' = 'MES';

//   mesSelecionado: number | null = null;

//   diaSelecionado: number | null = null;


//   // ============================================================
//   // CONTROLE DA TELA
//   // ============================================================

//   carregando: boolean = false;

//   tituloGrafico: string = 'Consumo mensal';


//   // ============================================================
//   // KPIs
//   // ============================================================

//   kpis = {
//     agua: {
//       valor: '0,00',
//       variacao: 0
//     },

//     energia: {
//       valor: '0,00',
//       variacao: 0
//     },

//     gas: {
//       valor: '0,00',
//       variacao: 0
//     }
//   };


//   // ============================================================
//   // TABELA DE LEITURAS
//   // ============================================================

//   leiturasDetalhadas: Array<{
//     data: string;
//     hora: string;
//     leitura: number;
//     consumo: number;
//     tipo: string;
//   }> = [];


//   // ============================================================
//   // GRÁFICO
//   // ============================================================

//   chartOptions: ApexOptions = {

//     series: [],

//     chart: {
//       type: 'bar',
//       height: 280,
//       toolbar: {
//         show: false
//       },
//       background: 'transparent'
//     },

//     xaxis: {
//       categories: []
//     },

//     theme: {
//       mode: 'dark'
//     }
//   };


//   // ============================================================
//   // CONSTRUTOR
//   // ============================================================

//   constructor(
//     private dashboardService: DashboardService,
//     private cdr: ChangeDetectorRef
//   ) { }


//   // ============================================================
//   // INICIALIZAÇÃO
//   // ============================================================

//   ngOnInit(): void {

//     console.log('DASHBOARD INICIOU');

//     this.carregarImoveis();
//   }


//   // ============================================================
//   // CARREGAR IMÓVEIS
//   // ============================================================

//   carregarImoveis(): void {

//     console.log('1. Chamando API de imóveis...');

//     this.dashboardService.getImoveis().subscribe({

//       next: (dados) => {

//         console.log('2. Imóveis recebidos:', dados);

//         this.imoveis = dados || [];

//         if (this.imoveis.length > 0) {

//           this.imovelSelecionadoId =
//             String(this.imoveis[0].id);

//           console.log(
//             '3. Imóvel selecionado:',
//             this.imovelSelecionadoId
//           );

//           this.carregarDadosDoImovel();

//         } else {

//           console.log(
//             '3. NENHUM IMÓVEL ENCONTRADO'
//           );

//         }
//       },

//       error: (err) => {

//         console.error(
//           'ERRO AO BUSCAR IMÓVEIS:',
//           err
//         );

//       }

//     });
//   }


//   // ============================================================
//   // CARREGAR DADOS DO IMÓVEL
//   // ============================================================

//   carregarDadosDoImovel(): void {

//     console.log(
//       'IMÓVEL SELECIONADO:',
//       this.imovelSelecionadoId
//     );

//     if (!this.imovelSelecionadoId) {
//       return;
//     }

//     this.carregando = true;


//     // Sempre que trocar de imóvel,
//     // voltamos para a visão mensal.

//     this.filtroVisao = 'MES';

//     this.mesSelecionado = null;

//     this.diaSelecionado = null;

//     this.tituloGrafico = 'Consumo mensal';


//     this.dashboardService.getMedidores()
//       .pipe(

//         switchMap((todosMedidores: Medidor[]) => {

//           console.log(
//             'TODOS OS MEDIDORES:',
//             todosMedidores
//           );


//           // O relacionamento atual da API é:
//           //
//           // medidor.imovel.id
//           //
//           // por isso usamos m.imovel?.id

//           this.medidoresDoImovel =
//             (todosMedidores || []).filter((m) => {

//               return String(m.imovel?.id) ===
//                 String(this.imovelSelecionadoId);

//             });


//           console.log(
//             'MEDIDORES DO IMÓVEL SELECIONADO:',
//             this.medidoresDoImovel
//           );


//           return forkJoin({

//             leituras:
//               this.dashboardService.getLeituras()

//           });

//         })

//       )
//       .subscribe({

//         next: ({ leituras }) => {

//           console.log(
//             'LEITURAS BRUTAS DA API:',
//             leituras
//           );

//           console.log(
//             'PRIMEIRA LEITURA:',
//             leituras?.[0]
//           );

//           console.log(
//             'MEDIDORES DO IMÓVEL:',
//             this.medidoresDoImovel
//           );

//           // IDs dos medidores pertencentes ao imóvel

//           const idsMedidores = new Set(
//             this.medidoresDoImovel.map(
//               (m) => String(m.id)
//             )
//           );


         

//           this.leiturasDoImovel =
//             (leituras || [])
//               .filter((l) => {
//                 const idMedidorLeitura = l.medidor?.id;

//                 return idsMedidores.has(String(idMedidorLeitura));
//               })
//               .map((l) => {
//                 const idMedidorLeitura = l.medidor?.id;

//                 return {
//                   ...l,
//                   medidor: this.medidoresDoImovel.find(
//                     (m) =>
//                       String(m.id) === String(idMedidorLeitura)
//                   )
//                 };
//               });




//           const leiturasDoImovel = (leituras || [])
//             .filter((l) =>
//               idsMedidores.has(String(l.medidor?.id))
//             )
//             .map((l) => ({
//               ...l,

//               medidor: this.medidoresDoImovel.find(
//                 (m) =>
//                   String(m.id) === String(l.medidor?.id)
//               )
//             }));

//           console.log(
//             'LEITURAS DO IMÓVEL:',
//             leiturasDoImovel
//           );


//           // KPIs
//           console.log('CHAMANDO PROCESSAR KPIs');

//           this.processarKPIs(
//             leiturasDoImovel
//           );


//           // Tabela inicial
//           console.log('CHAMANDO PROCESSAR TABELA');

//           this.processarTabelaDetalhada(
//             leiturasDoImovel
//           );



//           // Gráfico

//           this.carregarConsumoGrafico();

//         },


//         error: (err) => {

//           console.error(
//             'Erro ao carregar dados:',
//             err
//           );

//           this.carregando = false;

//           this.cdr.detectChanges();

//         }

//       });
//   }


//   // ============================================================
//   // ALTERAR VISÃO
//   // ============================================================

//   alterarVisao(
//     tipo: 'ANO' | 'MES' | 'DIA'
//   ): void {

//     console.log(
//       'Alterando visão para:',
//       tipo
//     );


//     this.filtroVisao = tipo;


//     // ----------------------------------------------------------
//     // VISÃO MENSAL
//     // ----------------------------------------------------------

//     if (tipo === 'MES') {

//       this.mesSelecionado = null;

//       this.diaSelecionado = null;

//       this.tituloGrafico =
//         'Consumo mensal';

//       this.carregarConsumoGrafico();

//       return;
//     }


//     // ----------------------------------------------------------
//     // VISÃO DIÁRIA
//     // ----------------------------------------------------------

//     if (tipo === 'DIA') {

//       // Se nenhum mês foi escolhido,
//       // utiliza o mês atual.

//       if (!this.mesSelecionado) {

//         this.mesSelecionado =
//           this.mesAtual;

//       }


//       this.diaSelecionado = null;


//       this.tituloGrafico =
//         `Consumo diário - ${this.obterNomeMes(
//           this.mesSelecionado
//         )
//         }`;


//       this.carregarConsumoGrafico();


//       // Atualiza a tabela para o mês.

//       this.carregarLeiturasDoMes(
//         this.mesSelecionado
//       );

//       return;
//     }


//     // ----------------------------------------------------------
//     // VISÃO ANUAL
//     // ----------------------------------------------------------

//     if (tipo === 'ANO') {

//       this.mesSelecionado = null;

//       this.diaSelecionado = null;

//       this.tituloGrafico =
//         `Consumo anual - ${this.anoAtual}`;

//       this.carregarConsumoGrafico();

//     }

//   }


//   // ============================================================
//   // CLIQUE NO ano
//   // ============================================================

//   selecionarAno(ano: number): void {

//     console.log('ANO SELECIONADO:', ano);

//     // Guarda o ano selecionado
//     this.anoAtual = ano;

//     // Limpa seleções anteriores
//     this.mesSelecionado = null;
//     this.diaSelecionado = null;

//     // Agora vamos para a visão dos meses
//     this.filtroVisao = 'MES';

//     // Atualiza o título
//     this.tituloGrafico = `Consumo mensal - ${ano}`;

//     // Carrega novamente o gráfico
//     // agora no nível dos meses
//     this.carregarConsumoGrafico();

//     // Por enquanto não vamos mexer na tabela.
//   }


//   // ============================================================
//   // CLIQUE NO MÊS
//   // ============================================================

//   selecionarMes(mes: number): void {

//     console.log(
//       'MÊS SELECIONADO:',
//       mes
//     );


//     this.mesSelecionado = mes;

//     this.diaSelecionado = null;

//     this.filtroVisao = 'DIA';


//     this.tituloGrafico =
//       `Consumo diário - ${this.obterNomeMes(mes)
//       }`;


//     // Carrega o gráfico diário

//     this.carregarConsumoGrafico();


//     // Carrega as leituras daquele mês

//     this.carregarLeiturasDoMes(
//       mes
//     );

//   }


//   // ============================================================
//   // CLIQUE NO DIA
//   // ============================================================

//   selecionarDia(dia: number): void {

//     console.log(
//       'DIA SELECIONADO:',
//       dia
//     );


//     if (!this.mesSelecionado) {

//       console.warn(
//         'Nenhum mês selecionado.'
//       );

//       return;

//     }


//     this.diaSelecionado = dia;


//     this.tituloGrafico =
//       `Leituras do dia ${dia}/${this.mesSelecionado}/${this.anoAtual}`;


//     // Mostra as leituras do dia na tabela

//     this.carregarLeiturasDoDia(
//       dia
//     );

//   }


//   // ============================================================
//   // CARREGAR GRÁFICO
//   // ============================================================

//   private carregarConsumoGrafico(): void {

//     if (
//       this.medidoresDoImovel.length === 0
//     ) {

//       this.montarGraficoVazio();

//       this.carregando = false;

//       this.cdr.detectChanges();

//       return;
//     }

//     const nivel = this.filtroVisao.toLowerCase() as 'dia' | 'mes' | 'ano';

//     const mesParaConsulta =
//       this.mesSelecionado ??
//       this.mesAtual;


//     console.log(
//       'NÍVEL DA CONSULTA:',
//       nivel
//     );

//     console.log(
//       'ANO:',
//       this.anoAtual
//     );

//     console.log(
//       'MÊS:',
//       mesParaConsulta
//     );


//     const requisicoes =
//       this.medidoresDoImovel.map(
//         (medidor) =>

//           this.dashboardService
//             .getConsumoMedidor(
//               medidor.id,
//               nivel,
//               this.anoAtual,
//               mesParaConsulta
//             )

//       );


//     forkJoin(requisicoes)
//       .subscribe({

//         next: (resultadosConsumo) => {

//           console.log(
//             '===== RESULTADO DO CONSUMO ====='
//           );

//           console.log(
//             resultadosConsumo
//           );

//           console.log(
//             'QUANTIDADE DE RESULTADOS:',
//             resultadosConsumo.length
//           );


//           this.montarGraficoMultiplasSeries(
//             resultadosConsumo
//           );


//           this.carregando = false;

//           this.cdr.detectChanges();

//         },


//         error: (err) => {

//           console.error(
//             'Erro ao carregar consumo:',
//             err
//           );

//           this.montarGraficoVazio();

//           this.carregando = false;

//           this.cdr.detectChanges();

//         }

//       });

//   }


//   // ============================================================
//   // MONTAR GRÁFICO
//   // ============================================================

//   private montarGraficoMultiplasSeries(
//     resultadosConsumo: any[][]
//   ): void {

//     // let categorias: string[] = [];
//     const categorias = this.obterCategoriasPorFiltro();


//     const coresTipos: Record<string, string> = {

//       AGUA: '#0ea5e9',

//       ENERGIA: '#f59e0b',

//       GAS: '#ef4444'

//     };


//     const series =
//       this.medidoresDoImovel.map(
//         (medidor, idx) => {

//           const consumoArray =
//             resultadosConsumo[idx] || [];


//           const dadosMapeados =
//             categorias.map(
//               (_, index) => {


//                 const itemEncontrado =
//                   consumoArray.find((c) => {


//                     // ------------------------------------------------
//                     // ANO
//                     // ------------------------------------------------




//                     if (this.filtroVisao === 'ANO') {

//                       const anoItem =
//                         c.ano ??
//                         c.periodo ??
//                         c.name ??
//                         (
//                           c.data
//                             ? new Date(c.data).getFullYear()
//                             : null
//                         );

//                       return Number(anoItem) ===
//                         Number(categorias[index]);
//                     }


//                     // if (this.filtroVisao === 'ANO') {

//                     //   return [
//                     //     '2025',
//                     //     '2026',
//                     //     '2027'
//                     //   ];
//                     // }



//                     // ------------------------------------------------
//                     // MENSAL
//                     // ------------------------------------------------

//                     if (
//                       this.filtroVisao === 'MES'
//                     ) {

//                       const mesItem =
//                         c.mes ??
//                         c.periodo ??
//                         c.name ??
//                         (
//                           c.data
//                             ? new Date(c.data)
//                               .getMonth() + 1
//                             : null
//                         );


//                       return Number(mesItem) ===
//                         index + 1;

//                     }


//                     // ------------------------------------------------
//                     // DIÁRIO
//                     // ------------------------------------------------

//                     if (
//                       this.filtroVisao === 'DIA'
//                     ) {

//                       const diaItem =
//                         c.dia ??
//                         c.periodo ??
//                         c.name ??
//                         (
//                           c.data
//                             ? new Date(c.data)
//                               .getDate()
//                             : null
//                         );


//                       return Number(diaItem) ===
//                         index + 1;

//                     }


//                     // ------------------------------------------------
//                     // ANUAL
//                     // ------------------------------------------------

//                     return true;

//                   });


//                 if (!itemEncontrado) {

//                   return 0;

//                 }


//                 const valor =
//                   itemEncontrado.value ??
//                   itemEncontrado.totalConsumo ??
//                   itemEncontrado.consumo ??
//                   itemEncontrado.valor ??
//                   itemEncontrado.total ??
//                   0;


//                 return Number(valor);

//               }
//             );


//           return {

//             name:
//               medidor.tipo ||
//               `Medidor ${idx + 1}`,

//             data:
//               dadosMapeados,

//             color:
//               coresTipos[medidor.tipo] ||
//               '#0ea5e9'

//           };

//         }
//       );


//     console.log(
//       'CATEGORIAS:',
//       categorias
//     );

//     console.log(
//       'SERIES GERADAS:',
//       series
//     );


//     // ==========================================================
//     // NOVA CONFIGURAÇÃO DO APEXCHARTS
//     // ==========================================================

//     this.chartOptions = {

//       series: [
//         ...series
//       ],


//       chart: {

//         type: 'bar',

//         height: 280,

//         toolbar: {
//           show: false
//         },

//         background: 'transparent',

//         events: {

//           dataPointSelection: (
//             event,
//             chartContext,
//             config
//           ) => {

//             if (!config) {
//               return;
//             }

//             const index = config.dataPointIndex;

//             console.log('COLUNA CLICADA:', index);


//             // ==========================================
//             // ANO → seleciona o ano clicado
//             // ==========================================
//             if (this.filtroVisao === 'ANO') {

//               const categorias = this.obterCategoriasPorFiltro();

//               const ano = Number(categorias[index]);


//               console.log('COLUNA CLICADA:', index);
//               console.log('ANO CLICADO:', ano);


//               this.selecionarAno(ano);

//               return;
//             }

//             // ==========================================
//             // MES → seleciona o mes clicado
//             // ==========================================

//             if (
//               this.filtroVisao === 'MES'
//             ) {

//               const mes =
//                 index + 1;

//               console.log('MÊS CLICADO:', mes);

//               this.selecionarMes(
//                 mes
//               );

//             }


//             // ==========================================
//             // DIA → seleciona o dia clicado
//             // ==========================================

//             else if (
//               this.filtroVisao === 'DIA'
//             ) {

//               const dia =
//                 index + 1;

//               console.log('DIA CLICADO:', dia);

//               this.selecionarDia(
//                 dia
//               );

//             }

//           }

//         }

//       },




//       plotOptions: {

//         bar: {

//           columnWidth: '50%',

//           borderRadius: 4,

//           distributed: false

//         }

//       },


//       dataLabels: {

//         enabled: false

//       },


//       xaxis: {

//         categories: [
//           ...categorias
//         ],

//         labels: {

//           style: {
//             colors: '#94a3b8'
//           }

//         }

//       },


//       grid: {

//         borderColor:
//           'rgba(255, 255, 255, 0.05)'

//       },


//       theme: {

//         mode: 'dark'

//       }

//     };

//   }





//   // ============================================================
//   // CATEGORIAS DO GRÁFICO
//   // ============================================================


//   obterCategoriasPorFiltro(): string[] {

//     // ==========================================
//     // NÍVEL 1: ANO
//     // ==========================================
//     if (this.filtroVisao === 'ANO') {

//       const anos = this.obterAnosDisponiveis();

//       console.log('ANOS DISPONÍVEIS:', anos);

//       return anos.map(ano => String(ano));
//     }


//     // ==========================================
//     // NÍVEL 2: MÊS
//     // ==========================================
//     if (this.filtroVisao === 'MES') {

//       return [
//         'Jan',
//         'Fev',
//         'Mar',
//         'Abr',
//         'Mai',
//         'Jun',
//         'Jul',
//         'Ago',
//         'Set',
//         'Out',
//         'Nov',
//         'Dez'
//       ];
//     }


//     // ==========================================
//     // NÍVEL 3: DIA
//     // ==========================================
//     if (this.filtroVisao === 'DIA') {

//       const mes = this.mesSelecionado ?? this.mesAtual;

//       const quantidadeDias =
//         new Date(this.anoAtual, mes, 0).getDate();

//       return Array.from(
//         { length: quantidadeDias },
//         (_, i) => `${i + 1}`
//       );
//     }


//     return [];
//   }







//   // ============================================================
//   // NOME DO MÊS
//   // ============================================================

//   private obterNomeMes(
//     mes: number
//   ): string {

//     const meses = [

//       'Janeiro',
//       'Fevereiro',
//       'Março',
//       'Abril',
//       'Maio',
//       'Junho',
//       'Julho',
//       'Agosto',
//       'Setembro',
//       'Outubro',
//       'Novembro',
//       'Dezembro'

//     ];


//     return meses[mes - 1] || '';

//   }

//   obterNomeMesPublico(): string {
//     if (!this.mesSelecionado) {
//       return this.obterNomeMes(this.mesAtual);
//     }

//     return this.obterNomeMes(this.mesSelecionado);
//   }

//   obterAnosDisponiveis(): number[] {

//     const anos = this.leiturasDoImovel
//       .map(leitura => {
//         const data = new Date(leitura.dataHora);
//         return data.getFullYear();
//       });

//     return [...new Set(anos)].sort((a, b) => a - b);
//   }


//   // ============================================================
//   // CARREGAR LEITURAS DO MÊS
//   // ============================================================







//   private carregarLeiturasDoMes(mes: number): void {

//     console.log('CARREGANDO LEITURAS DO MÊS:', mes);

//     this.dashboardService.getLeituras().subscribe({

//       next: (leituras) => {

//         const idsMedidores = new Set(
//           this.medidoresDoImovel.map(
//             (m) => String(m.id)
//           )
//         );

//         const leiturasDoMes = (leituras || [])

//           // =====================================================
//           // MEDIDORES DO IMÓVEL
//           // =====================================================

//           .filter((l) => {

//             const idMedidorLeitura =
//               l.medidor?.id;

//             return idsMedidores.has(
//               String(idMedidorLeitura)
//             );

//           })

//           // =====================================================
//           // ADICIONA O MEDIDOR COMPLETO
//           // =====================================================

//           .map((l) => {

//             const idMedidorLeitura =
//               l.medidor?.id;

//             return {

//               ...l,

//               medidor:
//                 this.medidoresDoImovel.find(
//                   (m) =>
//                     String(m.id) ===
//                     String(idMedidorLeitura)
//                 )

//             };

//           })

//           // =====================================================
//           // FILTRA ANO E MÊS
//           // =====================================================

//           .filter((l) => {

//             const data =
//               new Date(l.dataHora);

//             return (

//               data.getFullYear() ===
//               this.anoAtual

//               &&

//               data.getMonth() + 1 ===
//               mes

//             );

//           });


//         console.log(
//           'LEITURAS DO MÊS:',
//           leiturasDoMes
//         );

//         console.log(
//           'QUANTIDADE DE LEITURAS DO MÊS:',
//           leiturasDoMes.length
//         );


//         this.processarTabelaDetalhada(
//           leiturasDoMes
//         );


//         this.carregando = false;

//         this.cdr.detectChanges();

//       },

//       error: (err) => {

//         console.error(
//           'ERRO AO CARREGAR LEITURAS DO MÊS:',
//           err
//         );

//         this.leiturasDetalhadas = [];

//         this.carregando = false;

//         this.cdr.detectChanges();

//       }

//     });

//   }





//   // ============================================================
//   // CARREGAR LEITURAS DO DIA
//   // ============================================================







//   private carregarLeiturasDoDia(
//     dia: number
//   ): void {

//     if (!this.mesSelecionado) {

//       return;

//     }


//     this.carregando = true;


//     this.dashboardService
//       .getLeituras()
//       .subscribe({

//         next: (leituras) => {

//           const idsMedidores =
//             new Set(

//               this.medidoresDoImovel
//                 .map(
//                   (m) => String(m.id)
//                 )

//             );


//           const leiturasDoDia =
//             (leituras || [])

//               // =================================================
//               // MEDIDORES DO IMÓVEL
//               // =================================================

//               .filter((l) => {

//                 const idMedidorLeitura =
//                   l.medidor?.id;

//                 return idsMedidores.has(
//                   String(idMedidorLeitura)
//                 );

//               })


//               // =================================================
//               // ADICIONA O MEDIDOR COMPLETO
//               // =================================================

//               .map((l) => {

//                 const idMedidorLeitura =
//                   l.medidor?.id;

//                 return {

//                   ...l,

//                   medidor:
//                     this.medidoresDoImovel.find(
//                       (m) =>
//                         String(m.id) ===
//                         String(idMedidorLeitura)
//                     )

//                 };

//               })


//               // =================================================
//               // ANO
//               // =================================================

//               .filter((l) => {

//                 const data =
//                   new Date(l.dataHora);

//                 return (
//                   data.getFullYear() ===
//                   this.anoAtual
//                 );

//               })


//               // =================================================
//               // MÊS
//               // =================================================

//               .filter((l) => {

//                 const data =
//                   new Date(l.dataHora);

//                 return (
//                   data.getMonth() + 1 ===
//                   this.mesSelecionado
//                 );

//               })


//               // =================================================
//               // DIA
//               // =================================================

//               .filter((l) => {

//                 const data =
//                   new Date(l.dataHora);

//                 return (
//                   data.getDate() ===
//                   dia
//                 );

//               });


//           console.log(
//             'LEITURAS DO DIA:',
//             leiturasDoDia
//           );

//           console.log(
//             'QUANTIDADE DE LEITURAS DO DIA:',
//             leiturasDoDia.length
//           );


//           this.processarTabelaDetalhada(
//             leiturasDoDia
//           );


//           this.carregando = false;

//           this.cdr.detectChanges();

//         },


//         error: (err) => {

//           console.error(
//             'ERRO AO CARREGAR LEITURAS DO DIA:',
//             err
//           );


//           this.leiturasDetalhadas = [];

//           this.carregando = false;

//           this.cdr.detectChanges();

//         }

//       });

//   }



  

//   private processarKPIs(leituras: Leitura[]): void {

//     console.log('==============================');
//     console.log('PROCESSANDO KPIs');
//     console.log('LEITURAS RECEBIDAS:', leituras);
//     console.log('QUANTIDADE:', leituras.length);
//     console.log('==============================');

//     // 1. Pega somente as leituras do ano selecionado
//     const leiturasDoAno = leituras.filter((l) => {
//       return new Date(l.dataHora).getFullYear() === this.anoAtual;
//     });

//     let totalAgua = 0;
//     let totalEnergia = 0;
//     let totalGas = 0;

//     // 2. Percorre cada medidor
//     this.medidoresDoImovel.forEach((medidor) => {

//       // Pega somente as leituras desse medidor
//       const leiturasMedidor = leiturasDoAno
//         .filter((l) => l.medidor?.id === medidor.id)
//         .sort(
//           (a, b) =>
//             new Date(a.dataHora).getTime() -
//             new Date(b.dataHora).getTime()
//         );

//       // 3. Calcula o consumo entre as leituras
//       for (let i = 1; i < leiturasMedidor.length; i++) {

//         const atual = Number(leiturasMedidor[i].valor);
//         const anterior = Number(leiturasMedidor[i - 1].valor);

//         const consumo = atual - anterior;

//         // Ignora valores negativos
//         if (consumo < 0) {
//           continue;
//         }

//         // 4. Soma de acordo com o tipo do medidor
//         if (medidor.tipo === 'AGUA') {
//           totalAgua += consumo;
//         }

//         if (medidor.tipo === 'ENERGIA') {
//           totalEnergia += consumo;
//         }

//         if (medidor.tipo === 'GAS') {
//           totalGas += consumo;
//         }
//       }
//     });

//     // 5. Atualiza os cards
//     this.kpis = {
//       agua: {
//         valor: totalAgua.toFixed(2).replace('.', ','),
//         variacao: 0
//       },

//       energia: {
//         valor: totalEnergia.toFixed(2).replace('.', ','),
//         variacao: 0
//       },

//       gas: {
//         valor: totalGas.toFixed(2).replace('.', ','),
//         variacao: 0
//       }
//     };
//     console.log('==============================');
//     console.log('PROCESSANDO KPIs');
//     console.log('LEITURAS RECEBIDAS:', leituras);
//     console.log('QUANTIDADE:', leituras.length);
//     console.log('==============================');
//   }




//   // ============================================================
//   // PROCESSAR TABELA
//   // ============================================================



//   private processarTabelaDetalhada(
//     leituras: Leitura[]
//   ): void {

//     console.log('================================');
//     console.log('PROCESSANDO TABELA');
//     console.log('LEITURAS RECEBIDAS:', leituras);
//     console.log('QUANTIDADE:', leituras.length);
//     console.log('================================');

//     const ordenadas = [...leituras].sort(
//       (a, b) =>
//         new Date(b.dataHora).getTime() -
//         new Date(a.dataHora).getTime()
//     );

//     this.leiturasDetalhadas = ordenadas
//       .slice(0, 10)
//       .map((l, idx) => {

//         const dataObj = new Date(l.dataHora);

//         const anterior = ordenadas.find(
//           (item, itemIdx) =>
//             itemIdx > idx &&
//             String(item.medidor?.id) ===
//             String(l.medidor?.id)
//         );

//         const consumoCalculado = anterior
//           ? Number(l.valor) - Number(anterior.valor)
//           : 0;

//         const leituraFormatada = {
//           data: isNaN(dataObj.getTime())
//             ? '-'
//             : dataObj.toLocaleDateString('pt-BR'),

//           hora: isNaN(dataObj.getTime())
//             ? '-'
//             : dataObj.toLocaleTimeString(
//               'pt-BR',
//               {
//                 hour: '2-digit',
//                 minute: '2-digit'
//               }
//             ),

//           leitura: Number(l.valor) || 0,

//           consumo: Number(
//             consumoCalculado.toFixed(2)
//           ),

//           tipo:
//             l.medidor?.tipo ||
//             'N/A'
//         };

//         console.log(
//           'LINHA GERADA:',
//           leituraFormatada
//         );

//         return leituraFormatada;
//       });

//     console.log(
//       '================================'
//     );

//     console.log(
//       'LEITURAS DETALHADAS:',
//       this.leiturasDetalhadas
//     );

//     console.log(
//       'QUANTIDADE NA TABELA:',
//       this.leiturasDetalhadas.length
//     );

//     console.log(
//       '================================'
//     );
//   }



//   // ============================================================
//   // GRÁFICO VAZIO
//   // ============================================================

//   private montarGraficoVazio(): void {

//     this.chartOptions = {

//       series: [],

//       chart: {

//         type: 'bar',

//         height: 280,

//         toolbar: {
//           show: false
//         },

//         background: 'transparent'

//       },

//       xaxis: {

//         categories:
//           this.obterCategoriasPorFiltro()

//       },

//       theme: {

//         mode: 'dark'

//       }

//     };

//   }

// }