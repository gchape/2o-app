CREATE TYPE "category" AS ENUM('shoes', 'clothing');--> statement-breakpoint
CREATE TYPE "department" AS ENUM('men', 'women', 'kids');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "address" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"sku_id" uuid,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"color" text,
	"size" text,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"status" "order_status" DEFAULT 'pending'::"order_status" NOT NULL,
	"total" integer NOT NULL,
	"currency" text NOT NULL,
	"shipping_address" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"url" text NOT NULL UNIQUE,
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"brand" text,
	"description" text,
	"department" "department" NOT NULL,
	"category" "category" NOT NULL,
	"warehouse" text GENERATED ALWAYS AS (regexp_replace(split_part("product"."url", '/', 3), '^www\.', '')) STORED NOT NULL,
	"currency" text DEFAULT 'GEL' NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"color" text NOT NULL,
	"size" text NOT NULL,
	"image_url" text,
	"price" integer NOT NULL,
	"original_price" integer,
	"discount" integer GENERATED ALWAYS AS (
					case when "skus"."original_price" > "skus"."price"
					then round(("skus"."original_price" - "skus"."price") * 100.0 / "skus"."original_price")::int
					else 0 end
				) STORED NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skus_product_color_size_uq" UNIQUE("product_id","color","size")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "address_user_idx" ON "address" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "address_primary_uq" ON "address" ("user_id") WHERE "is_primary";--> statement-breakpoint
CREATE INDEX "order_item_order_idx" ON "order_item" ("order_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX "product_listing_idx" ON "product" ("department","category");--> statement-breakpoint
CREATE INDEX "skus_product_price_idx" ON "skus" ("product_id","price");--> statement-breakpoint
CREATE INDEX "skus_deals_idx" ON "skus" ("product_id","discount" DESC NULLS LAST,"id") WHERE "in_stock" and "discount" > 0;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
ALTER TABLE "address" ADD CONSTRAINT "address_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_sku_id_skus_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "skus"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "skus" ADD CONSTRAINT "skus_product_id_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;