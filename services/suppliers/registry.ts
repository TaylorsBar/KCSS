import { ISupplierAdapter, SupplierId } from './types';
import { caridAdapter } from './carid';
import { carparts2uAdapter } from './carparts2u';
import { nzPerformanceAdapter } from './nz_performance';
import { repcoAdapter } from './repco';
import { rockautoAdapter } from './rockauto';
import { cooldriveIShopAdapter } from './cooldriveIShopAdapter';

const adapters: Record<SupplierId, ISupplierAdapter> = {
    carid: caridAdapter,
    carparts2u: carparts2uAdapter,
    nz_performance: nzPerformanceAdapter,
    repco: repcoAdapter,
    rockauto: rockautoAdapter,
    cooldrive: cooldriveIShopAdapter,
};

export const getAdapter = (id: SupplierId): ISupplierAdapter => {
    const adapter = adapters[id];
    if (!adapter) {
        throw new Error(`No supplier adapter found for ID: ${id}`);
    }
    return adapter;
};
