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

import { isEqual } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { newError } from '@parity/shared/redux/actions';
import { arrayOrObjectProptype } from '@parity/shared/util/proptypes';
import { parseAbiType } from '@parity/shared/util/abi';
import { Button, Container, Progress, TypedInput } from '@parity/ui';

import styles from './queries.css';

class InputQuery extends Component {
  static contextTypes = {
    api: PropTypes.object
  };

  static propTypes = {
    contract: PropTypes.object.isRequired,
    inputs: arrayOrObjectProptype().isRequired,
    outputs: arrayOrObjectProptype().isRequired,
    name: PropTypes.string.isRequired,
    newError: PropTypes.func.isRequired,
    signature: PropTypes.string.isRequired,
    className: PropTypes.string
  };

  state = {
    inputs: [],
    isValid: true,
    results: [],
    values: {}
  };

  componentWillMount () {
    this.parseInputs();
  }

  componentWillReceiveProps (nextProps) {
    const prevInputTypes = this.props.inputs.map((input) => input.type);
    const nextInputTypes = nextProps.inputs.map((input) => input.type);

    if (!isEqual(prevInputTypes, nextInputTypes)) {
      this.parseInputs(nextProps);
    }
  }

  parseInputs (props = this.props) {
    const inputs = props.inputs.map((input) => ({ ...input, parsed: parseAbiType(input.type) }));
    const values = inputs.reduce((values, input, index) => {
      values[index] = input.parsed.default;
      return values;
    }, {});

    this.setState({ inputs, values });
  }

  render () {
    const { name, className } = this.props;

    return (
      <Container className={ className }>
        <h3>{ name }</h3>
        { this.renderContent() }
      </Container>
    );
  }

  renderContent () {
    const { inputs } = this.state;

    const { isValid } = this.state;
    const inputsFields = inputs
      .map((input, index) => this.renderInput(input, index));

    return (
      <div>
        <div className={ styles.methodContent }>
          <div className={ styles.methodResults }>
            { this.renderResults() }
          </div>
          { inputsFields }
        </div>
        <div className={ styles.methodActions }>
          <Button
            label={
              <FormattedMessage
                id='contract.queries.buttons.query'
                defaultMessage='Query'
              />
            }
            disabled={ !isValid }
            onClick={ this.onClick }
          />
        </div>
      </div>
    );
  }

  renderResults () {
    const { results, isLoading } = this.state;
    const { outputs } = this.props;

    if (isLoading) {
      return (
        <Progress />
      );
    }

    if (!results || results.length < 1) {
      return null;
    }

    return outputs
      .map((out, index) => ({
        name: out.name,
        type: out.type,
        value: results[index]
      }))
      .map((out, index) => {
        const input = (
          <TypedInput
            allowCopy
            isEth={ false }
            param={ out.type }
            readOnly
            value={ out.value }
          />
        );

        return (
          <div key={ `${out.name}_${out.type}_${index}` }>
            <div className={ styles.queryResultName }>
              { out.name }
            </div>
            { input }
          </div>
        );
      });
  }

  renderInput (input, index) {
    const { values } = this.state;
    const { name, type } = input;
    const label = `${name ? `${name}: ` : ''}${type}`;

    const onChange = (value) => {
      const { values } = this.state;

      this.setState({
        values: {
          ...values,
          [ index ]: value
        }
      });
    };

    return (
      <div key={ `${name}_${type}_${index}` }>
        <TypedInput
          hint={ type }
          label={ label }
          isEth={ false }
          onChange={ onChange }
          param={ type }
          value={ values[index] }
        />
      </div>
    );
  }

  onClick = () => {
    const { inputs, values } = this.state;
    const { contract, name, outputs, signature } = this.props;

    this.setState({
      isLoading: true,
      results: []
    });

    const inputValues = inputs.map((input, index) => values[index]);

    contract
      .instance[signature]
      .call({ rawTokens: true }, inputValues)
      .then(results => {
        if (outputs.length === 1) {
          results = [ results ];
        }

        this.setState({
          isLoading: false,
          results
        });
      })
      .catch((error) => {
        console.error(`sending ${name} with params`, inputValues, error.message);

        this.props.newError(error);
        this.setState({
          isLoading: false
        });
      });
  };
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({
    newError
  }, dispatch);
}

export default connect(
  null,
  mapDispatchToProps
)(InputQuery);
