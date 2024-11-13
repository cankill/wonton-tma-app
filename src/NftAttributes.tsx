import './App.css'
import {Card } from "antd";
import { NftMetaAttributes } from "@wonton-lib/Types.ts";

export function NftAttributes ( { attributes }: {attributes: NftMetaAttributes[]}) {
    return (
      <Card type="inner" title="Attributes:" bordered={true}>
        {attributes.map((attribute) => (
            <div key={attribute.trait_type}><b>{attribute.trait_type}: </b>{attribute.value}</div>
        ))}
      </Card>
    );
}