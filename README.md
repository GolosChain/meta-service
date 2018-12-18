## Golos posts seen counter service

### Api methods:

#### getPostSeenCount
params:
* postLink - Строка в формате author/perm-link

result:
```
{
    "count": 103
}
```

#### recordSeen
params:
* postLink - Строка в формате author/perm-link
* fingerPrint - Строка являющаяся фингер принтом браузера
* ip - Строка, IPv4 or IPv6

result:
```
{
    "status": "OK"
}
```
