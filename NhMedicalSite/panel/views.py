from django.shortcuts import render, HttpResponse, render_to_response, redirect
# Create your views here.

def index(request):
    return render(request,'panel/index.html')






