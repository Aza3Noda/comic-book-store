package com.catalog.comicbook.model;
import jakarta.persistence.*;


@Entity
public class Comic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String title;
    private String publisher; //here goes if its Marvel, DC or other
    private float price;
    private int pages;
    private String description;
    private String characters;

    public Comic(String title, String publisher, float price, int pages, String description, String characters) {
        this.title = title;
        this.publisher = publisher;
        this.price = price;
        this.pages = pages;
        this.description = description;
        this.characters = characters;
        //function aplicar descuento
    }

    public void setTitle(String title) {
        this.title = title;
    }
    public void setPublisher(String publisher) {
        this.publisher = publisher;
    }
    public void setPrice(float price) {
        this.price = price;
    }
    public void setPages(int pages) {
        this.pages = pages;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public void setCharacters(String characters) {
        this.characters = characters;
    }
    public int getId() {return id;}
    public String getTitle() {return title;}
    public String getPublisher() {return publisher;}
    public float getPrice() {return price;}
    public int getPages() {return pages;}
    public String getDescription() {return description;}
    public String getCharacters() {return characters;}

}
