const Fabric_Client = require('fabric-client');
const path          = require('path');
const os = require('os')
const util = require('util')
const fs = require('fs'); 
const theStotePath = './hfc-key-store';

async function excuteRecall ( hash ) {

    var fabric_client = new Fabric_Client();
    var key = "name"

    // setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer = fabric_client.newPeer('grpc://localhost:7051');
    channel.addPeer(peer);

    //
    var member_user = null;

    // var store_path = path.join(os.homedir(), '.hfc-key-store');
    var store_path = path.join(theStotePath);
    
    console.log('Store path:'+store_path);

    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    result = await Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        // assign the store to the fabric client
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        // use the same location for the state store (where the users' certificate are kept)
        // and the crypto store (where the users' keys are kept)
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);

        // get the enrolled user from persistence, this user will sign all requests
        return fabric_client.getUserContext('user10', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded user1 from persistence');
            member_user = user_from_store;
        } else {
            throw new Error('Failed to get user1.... run registerUser.js');
        }

        // send the query proposal to the peer
        return channel.queryBlockByTxID(hash,peer,true,false);
        // return channel.queryByChaincode(request);
    }).then((query_responses) => {
        console.log("Query has completed, checking results");
        // query_responses could have more than one  results if there multiple peers were used as targets
        if (query_responses) {
            if (query_responses[0] instanceof Error) {
                console.error("error from query = ", query_responses[0]);
                result = "Could not locate tuna"
            } else {
                console.log("Response is ", query_responses);
                return query_responses
            }
        } else {
            console.log("No payloads were returned from query");
            result = "Could not locate tuna"
        }
    }).catch((err) => {
        console.error('Failed to query successfully :: ' + err);
        result = 'Failed to query successfully :: ' + err
        
    });

    // await ctx.render('index', {
    //     title, result
    // })
    return result
}

const result = excuteRecall();
console.log("result = " + result);