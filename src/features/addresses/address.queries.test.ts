import { QueryClient } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { addressesQuery } from "./address.queries";

vi.mock("./address.functions", () => ({ listAddressesFn: vi.fn() }));

it("keeps cached addresses separate when the signed-in account changes", () => {
	const client = new QueryClient();
	const addresses = [
		{
			id: "private-address",
			fullName: "Nino Beridze",
			phone: "+995555123456",
			line1: "12 Rustaveli Ave",
			line2: null,
			city: "Tbilisi",
			state: "Tbilisi",
			postalCode: "0108",
			country: "Georgia",
			isPrimary: true,
		},
	];
	client.setQueryData(addressesQuery("first-user").queryKey, addresses);

	expect(client.getQueryData(addressesQuery("first-user").queryKey)).toEqual(
		addresses,
	);
	expect(
		client.getQueryData(addressesQuery("second-user").queryKey),
	).toBeUndefined();
	expect(
		client.getQueryData(addressesQuery(undefined).queryKey),
	).toBeUndefined();
	expect(addressesQuery(undefined).enabled).toBe(false);
	client.clear();
});
