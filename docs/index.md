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

> [Additional Generation Params](request-parameters.md)

#### Custom user field object

Add user field object to property **custom&lt;Object&gt;** with field name as object key. 
Mandatory properties for child object is **label** and **value**.


```javascript
$checkout('Api').request('api.checkout.form',{
    merchant_id:123456,
    amount:250,
    currency:'USD',
    card_number:'4444555566661111',
    expire_date:'12/30',
    cvv2:'111',
    custom: {
        customer: {
            label: 'Customer',
            value: 'John Doe'    
        },
        user_id: {
            label: 'User ID',
            value: 1234567890    
        }
    }
});
```

You can use form nested name values to serve correct structure for custom field object as well.

Example:
```html
<input type="hidden" name="custom[user_id][label]" value="User ID" />
<input type="hidden" name="custom[user_id][value]" value="1234567890" />

<label for="customer">Customer</label>
<input type="hidden" name="custom[customer][label]" value="Customer" />
<input type="text" id="customer" name="custom[customer][value]" value="John Doe" />
```

## Response model

### Methods

#### attr('property')

#### sendResponse()

#### submitToMerchant()

#### waitOn3dsDecline()

#### submit3dsForm()

#### needVerifyCode()

### Properties

#### model.attr('info')

#### model.attr('order')

    
## Handle Response    

### 3d secure modal window

![](https://i.imgur.com/cneeQpL.jpg)
{:.text-center}

### 3d secure timeout request

```javascript
$checkout('Api').request('api.checkout.form',{ params }).notify(function(model){
    if(model.waitOn3dsDecline()){
        // show timer for next 3ds modal window
        setTimeout(function(){
            model.submit3dsForm();
        },model.waitOn3dsDecline());
    }       
});
```

![](https://i.imgur.com/cneeQpL.jpg)
{:.text-center}

### Submit to result page

Use method **submitToMerchant()** if **response_url** parameter is specified to redirect user on merchant page with 
order data object.

```javascript
$checkout('Api').request('api.checkout.form',{
    ... 
    response_url:'https://example.com/'
    ...
}).done(function(model){
    model.submitToMerchant();
});
```

### Handle gateway errors

```javascript
$checkout('Api').request('api.checkout.form',{ params }).fail(function(model){
    model.attr('error.code');
    model.attr('error.message');
});
```

<nav class="cards">
{% include navigation.html base_url="/docs/" %}
</nav>
