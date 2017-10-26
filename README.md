# batch-search-app
Electron app for batch geocoding

## setup

```bash
$ npm install
```

### create your config file
Your `config.json` file should look something like this and be located at the root of the project.

```javascript
{
  "auth": {
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "redirect_uri": "http://localhost:9000/mapzen/auth/callback",
    "host": "https://mapzen.com"
  },
  "search": {
    "baseUrl": "https://search.mapzen.com/v1/",
    "qps": 6
  }
}
```

Now you're ready to run your application using the following command.

```bash
$ npm start
```

## builds
Once you've successfully setup your application and have verified that it works on your machine, you can build install packages for various target platforms.
Currently only MacOS is supported.

```bash
$ npm run package-mac
```
