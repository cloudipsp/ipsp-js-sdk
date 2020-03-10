---
sort: 1
---

# Documentation

Download and installation, API methods description, frequently asked questions , organizing and releasing your source project.

## Initialize Api Component

### Singleton usage
```javascript
var checkout = $checkout('Api');
```
Use **$checkout('Api')** instance in inside nested scope
```javascript
var result = (function(instance){
    return $checkout('Api') === instance; // ==> their instances are equal
})(checkout);
```

### New Instance usage

Create new iframe connector for every Checkout.Api instance 

```javascript
var checkout = $checkout.get('Api');
```

## Send Request

### Method **.request()**

```javascript
$checkout('Api').request('api.checkout.form',{ params }); // return Defer object
```
### Basic params example


#### Token param (host-to-host)

```javascript
$checkout('Api').request('api.checkout.form',{
    token:'host-to-host-token',
    card_number:'4444555566661111',
    expire_date:'12/30',
    cvv2:'111'
});
```

#### Generation Params

```javascript
$checkout('Api').request('api.checkout.form',{
    merchant_id:123456,
    amount:250,
    currency:'USD',
    card_number:'4444555566661111',
    expire_date:'12/30',
    cvv2:'111'
});
```

#### &bull; [Additional Generation Params](request-parameters.md)

#### Custom user field object

```javascript
$checkout('Api').request('api.checkout.form',{
    merchant_id:123456,
    amount:250,
    currency:'USD',
    card_number:'4444555566661111',
    expire_date:'12/30',
    cvv2:'111'
});
```

## Handle Response

### Response model

<nav class="cards">
{% include navigation.html base_url="/docs/" %}
</nav>