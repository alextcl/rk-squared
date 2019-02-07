import * as React from 'react';

import { ColDef, GridApi, GridReadyEvent, RowNode } from 'ag-grid';
import { AgGridReact } from 'ag-grid-react';
import * as ReactTooltip from 'react-tooltip';

import * as _ from 'lodash';

import { RecordMateriaDetail } from '../../actions/recordMateria';
import { series, SeriesId } from '../../data/series';
import { GridContainer } from '../common/GridContainer';
import { DescriptionCell } from './DescriptionCell';
import { RecordMateriaTooltip } from './RecordMateriaTooltip';
import { StatusCell } from './StatusCell';

interface Props {
  recordMateria: { [id: number]: RecordMateriaDetail };
}

interface State {
  filter: string | undefined;
  count: number | undefined;
}

type Comparator = ColDef['comparator'];
function compareByNumberField(fieldName: string): Comparator {
  return (valueA, valueB, nodeA, nodeB) => {
    const getField = (node: RowNode | undefined) => ((node || { data: {} }).data || {})[fieldName];
    return getField(nodeA) - getField(nodeB);
  };
}

export class RecordMateriaGrid extends React.Component<Props, State> {
  columnDefs: ColDef[];
  objectValues = _.memoize(_.values);
  api: GridApi | undefined;

  constructor(props: Props) {
    super(props);

    this.columnDefs = [
      {
        headerName: 'Series',
        width: 65,
        field: 'characterId',
        valueGetter: ({ data }: { data: RecordMateriaDetail }) =>
          series.short[data.seriesId as SeriesId],
        comparator: compareByNumberField('characterId'),
      },
      { headerName: 'Character', width: 115, field: 'characterName' },
      { headerName: 'RM', width: 45, field: 'order' },
      { headerName: 'Name', width: 175, field: 'name' },
      {
        headerName: 'Description',
        width: 330,
        field: 'description',
        valueGetter: ({ data }: { data: RecordMateriaDetail }) =>
          data.description.replace('<br>', ' '),
        cellRendererFramework: DescriptionCell,
      },
      {
        headerName: 'Status',
        width: 150,
        field: 'status',
        valueGetter: ({ data }: { data: RecordMateriaDetail }) => data.statusDescription,
        cellRendererFramework: StatusCell,
        comparator: compareByNumberField('status'),
      },
    ];
    this.state = {
      filter: '',
      count: undefined,
    };
  }

  handleGridReady = ({ api }: GridReadyEvent) => {
    this.api = api;
    this.setState({ count: api.getDisplayedRowCount() });
  };

  handleFilter = (e: React.FormEvent<HTMLInputElement>) => {
    this.setState({ filter: e.currentTarget.value });
  };

  getRowNodeId = (row: RecordMateriaDetail) => '' + row.id;

  componentDidUpdate() {
    this.updateCount();
  }

  updateCount() {
    if (this.api) {
      const newCount = this.api.getDisplayedRowCount();
      if (this.state.count !== newCount) {
        this.setState({ count: newCount });
      }
    }
  }

  render() {
    const { recordMateria } = this.props;
    const { count } = this.state;
    return (
      <GridContainer style={{ height: '500px', width: '100%' }}>
        <div className="form-group">
          <input
            className="form-control form-control-sm"
            placeholder="Search..."
            value={this.state.filter}
            onChange={this.handleFilter}
          />
        </div>
        <AgGridReact
          enableSorting={true}
          enableColResize={true}
          columnDefs={this.columnDefs}
          rowData={this.objectValues(recordMateria)}
          quickFilterText={this.state.filter}
          deltaRowDataMode={true}
          getRowNodeId={this.getRowNodeId}
          onGridReady={this.handleGridReady}
          onViewportChanged={ReactTooltip.rebuild}
          onRowDataChanged={ReactTooltip.rebuild}
          onFilterChanged={ReactTooltip.rebuild}
        />
        <div className="text-right mt-1 text-muted">{count != null && count + ' materia'}</div>
        <RecordMateriaTooltip
          id={DescriptionCell.ID}
          descriptionOnly={true}
          recordMateria={recordMateria}
        />
      </GridContainer>
    );
  }
}
