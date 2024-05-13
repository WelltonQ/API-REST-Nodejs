import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'child_process'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 1000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should all list transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 1000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') || ['']

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New Transaction',
        amount: 1000,
      }),
    ])
  })

  it('should be able to get a specific transaction', async () => {
    const createTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 1000,
        type: 'credit',
      })

    const cookies = createTransaction.get('Set-Cookie') || ['']

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New Transaction',
        amount: 1000,
      }),
    )
  })

  it('should be able to get the sumary', async () => {
    const createCreditTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit Transaction',
        amount: 1000,
        type: 'credit',
      })

    const cookies = createCreditTransactionResponse.get('Set-Cookie') || ['']

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit Transaction',
        amount: 500,
        type: 'debit',
      })

    const listTransactionsSummaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsSummaryResponse.body.summary).toEqual(
      expect.objectContaining({
        amount: 500,
      }),
    )
  })
})
