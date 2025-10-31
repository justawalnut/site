import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create users
  const engineer1 = await prisma.user.upsert({
    where: { email: 'engineer1@example.com' },
    update: {},
    create: {
      email: 'engineer1@example.com',
      displayName: 'Alice (Engineer)',
    },
  })

  const engineer2 = await prisma.user.upsert({
    where: { email: 'engineer2@example.com' },
    update: {},
    create: {
      email: 'engineer2@example.com',
      displayName: 'Bob (Engineer)',
    },
  })

  const director1 = await prisma.user.upsert({
    where: { email: 'director1@example.com' },
    update: {},
    create: {
      email: 'director1@example.com',
      displayName: 'Charlie (Director)',
    },
  })

  const director2 = await prisma.user.upsert({
    where: { email: 'director2@example.com' },
    update: {},
    create: {
      email: 'director2@example.com',
      displayName: 'Diana (Director)',
    },
  })

  console.log('✅ Users created')

  // Create strategies
  const hvE2 = await prisma.strategy.upsert({
    where: { name: 'HV-E2' },
    update: {},
    create: {
      name: 'HV-E2',
      description: 'High-volatility momentum breakout strategy',
      status: 'staging',
    },
  })

  const arb1 = await prisma.strategy.upsert({
    where: { name: 'Arb-1' },
    update: {},
    create: {
      name: 'Arb-1',
      description: 'CEX-DEX arbitrage strategy',
      status: 'live',
    },
  })

  const mlExp = await prisma.strategy.upsert({
    where: { name: 'ML-Exp' },
    update: {},
    create: {
      name: 'ML-Exp',
      description: 'LSTM price prediction (experimental)',
      status: 'r_and_d',
    },
  })

  console.log('✅ Strategies created')

  // Create projects with readiness scores
  await prisma.project.upsert({
    where: { id: 'hv-e2-project' },
    update: {},
    create: {
      id: 'hv-e2-project',
      strategyId: hvE2.id,
      repoUrl: 'https://github.com/example/hv-e2',
      lastBacktestUrl: 'https://github.com/example/hv-e2/backtest-2025-10-25.pdf',
      runbookUrl: 'https://github.com/example/hv-e2/RUNBOOK.md',
      readinessScore: 81,
      readinessBreakdown: {
        risk: 85,
        parity: 88,
        data: 75,
        backtest: 80,
        code: 78,
        ops: 72,
      },
      notes: 'Ready for promotion after final testing',
    },
  })

  await prisma.project.upsert({
    where: { id: 'arb-1-project' },
    update: {},
    create: {
      id: 'arb-1-project',
      strategyId: arb1.id,
      repoUrl: 'https://github.com/example/arb-1',
      lastBacktestUrl: 'https://github.com/example/arb-1/backtest-2025-10-20.pdf',
      runbookUrl: 'https://github.com/example/arb-1/RUNBOOK.md',
      readinessScore: 88,
      readinessBreakdown: {
        risk: 95,
        parity: 90,
        data: 85,
        backtest: 88,
        code: 82,
        ops: 80,
      },
      notes: 'Currently live and performing well',
    },
  })

  await prisma.project.upsert({
    where: { id: 'ml-exp-project' },
    update: {},
    create: {
      id: 'ml-exp-project',
      strategyId: mlExp.id,
      repoUrl: 'https://github.com/example/ml-exp',
      readinessScore: 33,
      readinessBreakdown: {
        risk: 30,
        parity: 20,
        data: 50,
        backtest: 40,
        code: 35,
        ops: 25,
      },
      notes: 'Early R&D phase, needs extensive testing',
    },
  })

  console.log('✅ Projects created')

  // Create sample trades for today
  const today = new Date()
  today.setHours(10, 15, 0, 0)

  const trades = [
    {
      ts: new Date(today.getTime() + 0 * 60000),
      strategyId: hvE2.id,
      symbol: 'BTCUSDT',
      side: 'buy',
      qty: 0.5,
      price: 71000.0,
      fees: 1.5,
      venue: 'binance',
      tags: JSON.stringify(['breakout', 'ATR2x']),
      extTradeId: 'hv-e2-trade-001',
    },
    {
      ts: new Date(today.getTime() + 30 * 60000),
      strategyId: hvE2.id,
      symbol: 'BTCUSDT',
      side: 'sell',
      qty: 0.5,
      price: 71500.0,
      fees: 1.5,
      venue: 'binance',
      tags: JSON.stringify(['profit-take']),
      extTradeId: 'hv-e2-trade-002',
    },
    {
      ts: new Date(today.getTime() + 60 * 60000),
      strategyId: arb1.id,
      symbol: 'ETHUSDT',
      side: 'buy',
      qty: 2.0,
      price: 3500.0,
      fees: 2.0,
      venue: 'binance',
      tags: JSON.stringify(['arb-opportunity']),
      extTradeId: 'arb-1-trade-001',
    },
    {
      ts: new Date(today.getTime() + 61 * 60000),
      strategyId: arb1.id,
      symbol: 'ETHUSDT',
      side: 'sell',
      qty: 2.0,
      price: 3520.0,
      fees: 2.0,
      venue: 'uniswap',
      tags: JSON.stringify(['arb-close']),
      extTradeId: 'arb-1-trade-002',
    },
  ]

  await prisma.trade.createMany({
    data: trades,
  })

  console.log('✅ Sample trades created')

  // Create daily PnL data for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo)
    date.setDate(date.getDate() + i)

    // HV-E2 PnL (staging, gradually improving)
    const hvE2GrossPnl = 5000 + Math.random() * 10000 + i * 200
    const hvE2Fees = 200 + Math.random() * 100
    await prisma.dailyPnl.upsert({
      where: {
        d_strategyId: {
          d: date,
          strategyId: hvE2.id,
        },
      },
      update: {},
      create: {
        d: date,
        strategyId: hvE2.id,
        grossPnl: hvE2GrossPnl,
        fees: hvE2Fees,
        netPnl: hvE2GrossPnl - hvE2Fees,
        dd: -2.5 - Math.random() * 2,
        exposure: 0.3 + Math.random() * 0.2,
      },
    })

    // Arb-1 PnL (live, stable profits)
    const arb1GrossPnl = 8000 + Math.random() * 5000
    const arb1Fees = 150 + Math.random() * 50
    await prisma.dailyPnl.upsert({
      where: {
        d_strategyId: {
          d: date,
          strategyId: arb1.id,
        },
      },
      update: {},
      create: {
        d: date,
        strategyId: arb1.id,
        grossPnl: arb1GrossPnl,
        fees: arb1Fees,
        netPnl: arb1GrossPnl - arb1Fees,
        dd: -1.0 - Math.random(),
        exposure: 0.4 + Math.random() * 0.1,
      },
    })
  }

  console.log('✅ Daily PnL data created')

  // Create sample notes
  await prisma.note.create({
    data: {
      authorId: engineer1.id,
      scope: 'day',
      scopeRef: today.toISOString().split('T')[0],
      content:
        'What changed: Increased position size 0.3→0.5 BTC per signal\nWhat broke: Nothing\nWhat\'s next: Monitor over-weekend risk, consider tighter stops',
      strategyId: hvE2.id,
    },
  })

  await prisma.note.create({
    data: {
      authorId: engineer2.id,
      scope: 'strategy',
      scopeRef: arb1.id,
      content: 'Arb opportunities up 20% this week due to increased volatility. Consider scaling position.',
      strategyId: arb1.id,
    },
  })

  console.log('✅ Sample notes created')

  // Create sample decision
  await prisma.decision.create({
    data: {
      decidedBy: director1.id,
      strategyId: arb1.id,
      action: 'promote',
      rationale:
        'Strategy has shown consistent performance over 30 days. Readiness score 88/100. Promoting to live with 40% allocation.',
    },
  })

  console.log('✅ Sample decision created')

  console.log('🎉 Seed data complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
