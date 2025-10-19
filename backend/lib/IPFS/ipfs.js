import IPFS from 'ipfs-api';

const ipfs = IPFS({ 
  host: 'ipfs.infura.io', 
  port: 5001, 
  protocol: 'https' 
});

export default ipfs;