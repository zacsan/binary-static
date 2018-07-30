import {
    action,
    computed,
    observable }              from 'mobx';
import { ChartBarrierStore }  from './chart_barrier_store';
import {
    barriersObjectToArray,
    isBarrierSupported }      from './Helpers/barriers';
import BaseStore              from '../../base_store';
import { WS }                 from '../../../Services';
import { isEmptyObject }      from '../../../../_common/utility';

export default class SmartChartStore extends BaseStore {
    @observable symbol;
    @observable barriers = observable.object({});

    @action.bound
    onUnmount = () => {
        this.symbol = null;
        this.removeBarriers();
    };

    // ---------- Barriers ----------
    @action.bound
    createChartBarriers = (contract_type, proposal_response, onChartBarrierChange) => {
        if (isEmptyObject(this.barriers.main)) {
            let main_barrier = {};
            if (!proposal_response.error && isBarrierSupported(contract_type)) {
                main_barrier = new ChartBarrierStore(proposal_response.echo_req, onChartBarrierChange);
            }

            this.barriers = {
                main: main_barrier,
            };
        }
    };

    @action.bound
    updateBarriers(barrier_1, barrier_2) {
        if (!isEmptyObject(this.barriers.main)) {
            this.barriers.main.updateBarriers({ high: barrier_1, low: barrier_2 });
        }
    }

    @action.bound
    updateBarrierShade(is_over, contract_type) {
        if (!isEmptyObject(this.barriers.main)) {
            this.barriers.main.updateBarrierShade(this.barriers, is_over, contract_type);
        }
    }

    @action.bound
    removeBarriers() {
        this.barriers = {};
    }

    @computed
    get barriers_array() {
        return barriersObjectToArray(this.barriers);
    }

    // ---------- Chart Settings ----------
    @computed
    get settings() { // TODO: consider moving chart settings from ui_store to chart_store
        return (({ common, ui } = this.root_store) => ({
            assetInformation: ui.is_chart_asset_info_visible,
            countdown       : ui.is_chart_countdown_visible,
            lang            : common.current_language,
            position        : ui.is_chart_layout_default ? 'bottom' : 'left',
            theme           : ui.is_dark_mode_on ? 'dark' : 'light',
        }))();
    }

    // ---------- WS ----------
    wsSubscribe = (request_object, callback) => {
        if (request_object.subscribe !== 1) return;
        WS.subscribeTicksHistory(request_object, callback);
    };

    wsForget = (match_values, callback) => (
        WS.forget('ticks_history', callback, match_values)
    );

    wsSendRequest = (request_object) => (
        WS.sendRequest(request_object)
    );
};
