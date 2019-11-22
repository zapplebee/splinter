/**
 * Copyright 2019 Cargill Incorporated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import crypto from 'crypto';
import protos from '../../protobuf';
import {
  calculateNamespaceRegistryAddress,
  computeContractAddress,
  computeContractRegistryAddress,
  SABRE_FAMILY_NAME,
  SABRE_FAMILY_VERSION
} from '../addressing';
import { Contract } from './index';
import { TransactionBuilder } from './transactionBuilder';
import { Signer } from '../signing';
import { Transaction, TransactionHeader } from '../../compiled_protos';

function prepareSabreInputs(
  contractAddresses: string[],
  contract: Contract
): string[] {
  return [
    computeContractRegistryAddress(contract.name),
    computeContractAddress(contract.name, contract.version),
    calculateNamespaceRegistryAddress(contract.prefix),
    ...contractAddresses
  ];
}

export class SabreTransactionBuilder extends TransactionBuilder {
  contract: Contract;

  sabreVersion: string | null;

  constructor(contract: Contract, sabreVersion?: string) {
    super();
    this.contract = contract;
    this.sabreVersion = sabreVersion || SABRE_FAMILY_VERSION;
  }

  build(signer: Signer): Transaction {
    const batcherPublicKey = this.batcherPublicKey
      ? this.batcherPublicKey
      : signer.getPublicKey();

    const executeTransactionAction = protos.ExecuteContractAction.create({
      name: this.contract.name,
      version: this.contract.version,
      input: this.inputs,
      outputs: this.outputs,
      payload: this.payload
    });

    const sabrePayload = protos.sabrePayload
      .encode({
        action: protos.SabrePayload.Action.EXECUTE_CONTRACT,
        executeContract: executeTransactionAction
      })
      .finish();

    const sabreTransactionHeader = TransactionHeader.encode({
      familyName: SABRE_FAMILY_NAME,
      familyVersion: SABRE_FAMILY_VERSION,
      inputs: prepareSabreInputs(this.inputs, this.contract),
      outputs: this.outputs,
      signerPublicKey: signer.getPublicKey(),
      batcherPublicKey,
      dependencies: this.dependencies,
      payloadSha512: crypto
        .createHash('sha512')
        .update(sabrePayload)
        .digest('hex')
    }).finish();

    const headerSignature = signer.sign(sabreTransactionHeader);

    return Transaction.create({
      header: sabreTransactionHeader,
      headerSignature,
      payload: sabrePayload
    });
  }
}
