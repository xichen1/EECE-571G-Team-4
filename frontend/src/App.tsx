import { useReadContract, useWriteContract } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import wagmiContractConfig from '@/abi.ts';
import { Button } from '@components/ui/button.tsx';
import Manufacturer from '@pages/manufacturer/Manufacturer.tsx';

function App() {
  const { data: hash, writeContract } = useWriteContract();

  // const { connectors, connect } = useConnect();
  // const { address, isConnecting, isDisconnected } = useAccount();
  const { data: abc } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'products',
    args: [BigInt(1)],
  });
  console.log(abc);
  const submit = async (e: any) => {
    e.preventDefault();
    writeContract({
      ...wagmiContractConfig,
      functionName: 'createProduct',
      args: [BigInt(1), 'abc', BigInt(1), BigInt(1)],
    });
  };

  // const submitCheck = async (e: any) => {
  //   e.preventDefault();
  //   const { data: abc } = useReadContract({
  //     ...wagmiContractConfig,
  //     functionName: 'products',
  //   });
  //   console.log(abc);
  // };
  return (
    // <div>
    //   <Button onClick={submit} />
    //   {/*<Button onClick={submitCheck}>check</Button>*/}
    //   {hash && <div>Transaction Hash: {hash}</div>}
    //   <ConnectKitButton />
    // </div>
    <Manufacturer />
  );
  // if (isConnecting) return <div>Connecting...</div>;
  // if (isDisconnected) return <div>Disconnected</div>;
  // return <div>Connected Wallet: {address}</div>;
}

export default App;
