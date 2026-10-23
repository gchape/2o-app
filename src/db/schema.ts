import { defineRelations, type SQL, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { categorySlugs, departmentSlugs } from "#/data/catalog";
import { site } from "#/data/site";
import { account, user } from "#/db/auth-schema";

export * from "./auth-schema";

export const departmentEnum = pgEnum("department", departmentSlugs);
export const categoryEnum = pgEnum("category", categorySlugs);
export const orderStatusEnum = pgEnum("order_status", [
	"pending",
	"paid",
	"shipped",
	"delivered",
	"cancelled",
]);

export type ShippingAddress = {
	fullName: string;
	phone: string;
	line1: string;
	line2?: string;
	city: string;
	postalCode?: string;
	country: string;
};

const timestamps = {
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
};

export const product = pgTable(
	"product",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		url: text("url").notNull().unique(),
		slug: text("slug").notNull().unique(),
		name: text("name").notNull(),
		brand: text("brand"),
		description: text("description"),
		department: departmentEnum("department").notNull(),
		category: categoryEnum("category").notNull(),
		warehouse: text("warehouse")
			.generatedAlwaysAs(
				(): SQL =>
					sql`regexp_replace(split_part(${product.url}, '/', 3), '^www\\.', '')`,
			)
			.notNull(),
		currency: text("currency").notNull().default(site.currency),
		lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
		...timestamps,
	},
	(t) => [index("product_listing_idx").on(t.department, t.category)],
);

export const skus = pgTable(
	"skus",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		productId: uuid("product_id")
			.notNull()
			.references(() => product.id, { onDelete: "cascade" }),
		color: text("color").notNull(),
		size: text("size").notNull(),
		imageUrl: text("image_url"),
		price: integer("price").notNull(),
		originalPrice: integer("original_price"),
		discount: integer("discount")
			.generatedAlwaysAs(
				(): SQL => sql`
					case when ${skus.originalPrice} > ${skus.price}
					then round((${skus.originalPrice} - ${skus.price}) * 100.0 / ${skus.originalPrice})::int
					else 0 end
				`,
			)
			.notNull(),
		inStock: boolean("in_stock").notNull().default(true),
		...timestamps,
	},
	(t) => [
		unique("skus_product_color_size_uq").on(t.productId, t.color, t.size),
		index("skus_product_price_idx").on(t.productId, t.price),
		index("skus_deals_idx")
			.on(t.productId, t.discount.desc(), t.id)
			.where(sql`${t.inStock} and ${t.discount} > 0`),
	],
);

export const orders = pgTable(
	"orders",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		status: orderStatusEnum("status").notNull().default("pending"),
		total: integer("total").notNull(),
		currency: text("currency").notNull(),
		shippingAddress: jsonb("shipping_address")
			.$type<ShippingAddress>()
			.notNull(),
		...timestamps,
	},
	(t) => [index("orders_user_idx").on(t.userId)],
);

export const orderItem = pgTable(
	"order_item",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		skuId: uuid("sku_id").references(() => skus.id, {
			onDelete: "set null",
		}),
		name: text("name").notNull(),
		price: integer("price").notNull(),
		quantity: integer("quantity").notNull().default(1),
		color: text("color"),
		size: text("size"),
		imageUrl: text("image_url"),
	},
	(t) => [index("order_item_order_idx").on(t.orderId)],
);

export const relations = defineRelations(
	{ user, account, product, skus, orders, orderItem },
	(r) => ({
		user: {
			accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
			orders: r.many.orders({ from: r.user.id, to: r.orders.userId }),
		},
		account: {
			user: r.one.user({ from: r.account.userId, to: r.user.id }),
		},
		product: {
			skus: r.many.skus({ from: r.product.id, to: r.skus.productId }),
		},
		skus: {
			product: r.one.product({ from: r.skus.productId, to: r.product.id }),
		},
		orders: {
			user: r.one.user({ from: r.orders.userId, to: r.user.id }),
			items: r.many.orderItem({ from: r.orders.id, to: r.orderItem.orderId }),
		},
		orderItem: {
			order: r.one.orders({ from: r.orderItem.orderId, to: r.orders.id }),
			sku: r.one.skus({ from: r.orderItem.skuId, to: r.skus.id }),
		},
	}),
);
