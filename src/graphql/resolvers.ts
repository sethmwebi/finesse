import { Client } from "@apperate/iexjs";
import { lookup } from "dns";
import { DateResolver, BigIntResolver, JSONResolver } from "graphql-scalars";
import { GqlResolvers, GqlTimeframe } from "../generated/graphql";

const client = new Client({
  api_token: process.env.IEX_API_TOKEN,
  version: "v1",
});

const getQuote = (symbol: string) => {
  return client.quote({ symbol });
};

const resolvers: GqlResolvers = {
  Date: DateResolver,
  JSON: JSONResolver,
  BigInt: BigIntResolver,
  Query: {
    lookup: async (_, { symbol }) => {
      const quote = await getQuote(symbol);
      return {
        symbol,
        companyName: quote.companyName,
        logoUrl: "some-logo.png",
      };
    },
  },
  Lookup: {
    quote: async ({ symbol }) => {
      const quote = await getQuote(symbol);
      return {
        ...quote,
        perRatioTTM: quote.perRatio,
      };
    },
    revenue: async (lookup, { resolution }) => {
      const result = await client.timeSeries({
        id: "INCOME",
        key: lookup.symbol,
        limit: 100,
        range: "5y",
        subkey: resolution,
      });
      return result.map((point: any) => ({
        date: point.fiscalDate,
        value: point.totalRevenue,
      }));
    },
    historicalTotalReturn: async (_, {}) => {
      return {
        changePercent: 997,
        data: [
          {
            date: new Date("2020-01-01"),
            value: 100,
          },
          {
            date: new Date("2020-01-02"),
            value: 101,
          },
        ],
      };
    },
    snapshot: async (_, { timeframe }) => {
      switch (timeframe) {
        case GqlTimeframe.Today:
        case GqlTimeframe.Year1:
        case GqlTimeframe.Ytd:
          return {
            changePercent: 0.25,
          };
        case GqlTimeframe.Year5:
        case GqlTimeframe.Year10:
        case GqlTimeframe.Max:
          return {
            changePercent: 250,
            cagrPercent: 30,
          };
      }
    },
    stats: async ({ symbol }) => {
      return {
        marketCap: 2390000000000,
        peRatioTtm: 25.6,
        peRatioFwd: 23.1,
        profitMarginPercent: 25,
        freeCashFlowYield: 4.06,
        dividentYield: 0.6,
      };
    },
  },
};

export default resolvers;
