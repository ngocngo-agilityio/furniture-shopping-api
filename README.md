# skincare-server

## Getting started

- Clone repository (SSH)

```
git clone git@github.com:ngocngo-agilityio/furniture-shopping-api.git

```

- Install packages

```
pnpm install

```

- Run server

```
pnpm run start

```
## API Document
1. Register

    /register

    ```
    {
        "email": "ngoc.ngo@gmail.com",
        "password": "abcd1234@Q",
        "fullName": "Ngoc Ngo",
        "phoneNumber": "0909090910",
        "avatar": "https://via.placeholder.com/150"
    }
    ```

    /login

    ```
    {
        "email": "ngoc.ngo@gmail.com",
        "password": "abcd1234@Q"
    }
    ```

2. Init account (create account and card)

    /init-account

    ```
    {
        "userId": 3,
        "fullName": "Ngo Thi Ngoc"
    }
    ```
3. Get user info

    /me/:id


4. Get bank account info
5. Make transaction
6. Get and search transactions

    /accounts/:id/transactions?limit=10&page=1&fullName=David


