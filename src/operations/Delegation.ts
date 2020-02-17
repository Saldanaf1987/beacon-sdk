import { TezosOperation, TezosOperationType } from './OperationTypes'

export interface TezosDelegationOperation extends TezosOperation {
  kind: TezosOperationType.DELEGATION
  source: string
  fee: string
  counter: string
  gas_limit: string
  storage_limit: string
  delegate?: string
}