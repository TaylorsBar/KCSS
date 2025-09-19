import { ISupplierAdapter, SupplierResult, SearchOptions, Availability, Price, OrderRequest, OrderResponse } from './types';

/**
 * This CoolDrive iShop adapter simulates web-based search and order actions.
 * For MVP, this relies on opening a new browser tab for manual user interaction.
 */
class CoolDriveIShopAdapter implements ISupplierAdapter {
  readonly supplierId = 'cooldrive';

  // Launches the CoolDrive search URL with the query.
  async searchParts(query: string, options: SearchOptions): Promise<SupplierResult[]> {
    const ishopUrl = `https://ishop.cooldrive.com.au/?search=${encodeURIComponent(query)}`;
    window.open(ishopUrl, '_blank');
    // For manual integration, we cannot return structured data.
    // The gateway receives an empty array and continues with other suppliers.
    return [];
  }

  // Opens the product detail page for manual review or scraping.
  async getPartBySKU(sku: string): Promise<SupplierResult | null> {
    const url = `https://ishop.cooldrive.com.au/Product/${encodeURIComponent(sku)}`;
    window.open(url, '_blank');
    // We cannot know the part details without scraping, so we return null.
    return null;
  }

  // Manual stock lookup via in-line agent.
  async getAvailability(sku: string, region: string): Promise<Availability | null> {
    console.warn(`[CoolDriveIShopAdapter] Manual lookup required for availability of SKU: ${sku}`);
    return null;
  }

  // Manual price lookup via in-line agent.
  async getPricing(sku: string, region: string): Promise<Price | null> {
    console.warn(`[CoolDriveIShopAdapter] Manual lookup required for pricing of SKU: ${sku}`);
    return null;
  }

  // Opens the order page for manual completion.
  async placeOrder(payload: OrderRequest): Promise<OrderResponse> {
    window.open(`https://ishop.cooldrive.com.au/Order`, '_blank');
    return { orderId: 'manual-cooldrive', status: 'PENDING' };
  }
}

export const cooldriveIShopAdapter = new CoolDriveIShopAdapter();
