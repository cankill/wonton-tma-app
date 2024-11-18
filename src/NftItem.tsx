import { Image } from "antd";
import { Nft } from "@wonton-lib/Types.ts";
import { NftItemPreview } from "./NftItemPreview.tsx";
import { useCallback, useMemo, useState } from "react";
import { useNftItemContract } from "./hooks/useNftItemContract.ts";
import { Address } from "@ton/core";

export function NftItem({ nft, isNew }: { nft: Nft, isNew: boolean }) {
    const contract = useNftItemContract(Address.parse(nft.nft_address))

    const [previewVisible, setPreviewVisible] = useState(false);

    // Function to open the preview
    const closePreview = useCallback(() => {
        console.log("Set visibility = false for preview")
        setPreviewVisible(false);
    }, [setPreviewVisible]);

    // const imageUrl = useMemo(() => nft.nft_meta?.image.substring(0, nft.nft_meta?.image.lastIndexOf("/")) + "/preview.png", [nft]);
    const imageUrl = useMemo(() => nft.nft_meta?.image, [ nft ]);
    // console.log(`Nft previw: ${imageUrl}`);
    return (
        <Image
            rootClassName={isNew ? "new-nft" : ""}
            width={"3rem"}
            src={imageUrl}
            preview={{
                visible: previewVisible,
                onVisibleChange: (vis: boolean) => setPreviewVisible(vis),
                destroyOnClose: false,
                imageRender: () => (<NftItemPreview nft={nft} sendBetNft={contract.sendBetNft} sendBurnNft={contract.sendBurn} closePreview={closePreview}/>),
                toolbarRender: () => null,
            }}
        />

        // preview={ NftItemPreview(nft) }/>
    );
}