from django.shortcuts import render

# Create your views here.



def giris(request):

    return render(request,"home/Giris.html")

def index(request):

    return render(request,'home/index.html')


def iletisim(request):
    return render(request, "home/iletisim.html")


def magaza(request):
    return render(request,"home/magaza.html")


def urun(request):
    return render(request,"home/urun.html")

def sepet(request):
    return render(request, "home/sepet.html")