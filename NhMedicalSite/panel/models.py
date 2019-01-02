from __future__ import unicode_literals

from django.db import models

# Create your models here.

class Category(models.Model):
    category_name=models.CharField(max_length=100)

class Products(models.Model):
    title=models.CharField(max_length=100)
    content = models.TextField(max_length=300)
    product_image=models.ImageField(upload_to='images/products/',
                                     default='images/products/default.jpg')
    product_price=models.DecimalField(max_digits=6,decimal_places=4)
    category_id=models.ForeignKey(Category)

class User:
     name=models.CharField(max_length=50)
     lastname=models.CharField(max_length=50)
     email=models.EmailField(max_length=100)
     password=models.CharField(max_length=20)













