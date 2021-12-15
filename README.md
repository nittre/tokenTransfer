## API

(별로 restful 하지는 않음ㅎㅎ)

`GET /mnemonic/new`

-   body: x
-   return
    -   mnemonic (string)

`POST /wallet/new`: 새로운 지갑을 생성하고, DB에 주소와 개인키를 저장합니다.

-   body: username, passowrd, mnemonic
-   return
    -   username(string)
    -   address(string)

`POST /ethFaucet` : 가나슈 가상계정에서 사용자 계정으로 1이더를 제공합니다.

-   body: username, password
-   return
    -   username, address, balance, txHash (전부 string)

`POST /transfer` : req.body.to 주소로 req.body.amount 만큼 토큰을 전송합니다.

-   body: username, password, to, amount
-   return
    -   transaction hash, balance (전부 string)
