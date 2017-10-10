// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Container, TypedInput } from '@parity/ui';

import InputQuery from './inputQuery';

import styles from './queries.css';

export default class Queries extends Component {
  static contextTypes = {
    api: PropTypes.object
  }

  static propTypes = {
    contract: PropTypes.object,
    values: PropTypes.object
  }

  render () {
    const { contract } = this.props;

    if (!contract) {
      return null;
    }
    const queries = contract.functions
      .filter((fn) => fn.constant)
      .sort(this._sortEntries);

    const noInputQueries = queries
      .slice()
      .filter((fn) => fn.inputs.length === 0)
      .map((fn) => this.renderQuery(fn));

    const withInputQueries = queries
      .slice()
      .filter((fn) => fn.inputs.length > 0)
      .map((fn) => this.renderInputQuery(fn));

    if (queries.length + noInputQueries.length + withInputQueries.length === 0) {
      return null;
    }

    return (
      <Container
        title={
          <FormattedMessage
            id='contract.queries.title'
            defaultMessage='queries'
          />
        }
      >
        <div className={ styles.methods }>
          {
            noInputQueries.length > 0
            ? (
              <div className={ styles.vMethods }>
                { noInputQueries }
              </div>
            )
            : null
          }

          {
            withInputQueries.length > 0
            ? (
              <div className={ styles.hMethods }>
                { withInputQueries }
              </div>
            )
            : null
          }
        </div>
      </Container>
    );
  }

  renderInputQuery (fn) {
    const { abi, name, signature } = fn;
    const { contract } = this.props;

    return (
      <div className={ styles.container } key={ fn.signature }>
        <InputQuery
          className={ styles.method }
          inputs={ abi.inputs }
          outputs={ abi.outputs }
          name={ name }
          signature={ signature }
          contract={ contract }
        />
      </div>
    );
  }

  renderQuery (fn) {
    const { abi } = fn;
    let values = this.props.values[fn.name] || [];

    if (values && typeof values.slice === 'function') {
      values = values.slice();
    }

    return (
      <div
        className={ styles.container }
        key={ fn.signature }
      >
        <Container className={ styles.method }>
          <h3>{ fn.name }</h3>
          <div className={ styles.methodContent }>
            {
              abi.outputs.map((output, index) => this.renderValue(values[index], output, index))
            }
          </div>
        </Container>
      </div>
    );
  }

  renderValue (value, output, key) {
    if (typeof value === 'undefined') {
      return null;
    }

    const { name, type } = output;
    const label = `${name ? `${name}: ` : ''}${type}`;

    return (
      <TypedInput
        allowCopy
        key={ key }
        isEth={ false }
        label={ label }
        param={ output.type }
        readOnly
        value={ value }
      />
    );
  }

  _sortEntries (a, b) {
    return a.name.localeCompare(b.name);
  }
}
