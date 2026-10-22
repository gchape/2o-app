export const MAX_QUANTITY = 10;

export type CartItem = {
	id: string; // sku id (uuid)
	name: string;
	price: number; // minor units
	currency: string;
	image: string | null;
	quantity: number;
};
