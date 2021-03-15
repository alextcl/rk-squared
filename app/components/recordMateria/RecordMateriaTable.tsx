import * as React from 'react';

import * as _ from 'lodash';

import { RecordMateriaList, RecordMateriaProps } from './RecordMateriaList';
import { TableDefinition, TableRow } from './RecordMateriaTableDefinitions';

const styles = require('./RecordMateriaTable.module.scss');

interface Props extends RecordMateriaProps {
  tooltipId: string;
  table: TableDefinition;
}

export class RecordMateriaTable extends React.Component<Props> {
  renderCell = (row: TableRow, rowIndex: number, contents: string[], index: number) => {
    const { tooltipId, recordMateria, isAnonymous } = this.props;
    const show = _.filter(_.flatMap(contents, (s) => row.items[s]));
    return (
      <td key={index}>
        <RecordMateriaList
          tooltipId={tooltipId}
          recordMateria={recordMateria}
          isAnonymous={isAnonymous}
          show={show}
        />
      </td>
    );
  };

  renderRow = (row: TableRow, index: number) => {
    const { table } = this.props;
    return (
      <tr key={index}>
        <th scope="row">{row.header}</th>
        {table.contents.map((contents, i) => this.renderCell(row, index, contents, i))}
      </tr>
    );
  };

  render() {
    const { table } = this.props;
    const style = { width: (100 / (table.headers.length + 1)).toFixed(1) + '%' };
    return (
      <>
        <h4>{table.title}</h4>
        <table className={`table table-bordered table-responsive-sm ${styles.component}`}>
          <tbody>
            <tr>
              <th style={style} />
              {table.headers.map((header, i) => (
                <th key={i} style={style}>
                  {header}
                </th>
              ))}
            </tr>
            {table.rows.map(this.renderRow)}
          </tbody>
        </table>
      </>
    );
  }
}
