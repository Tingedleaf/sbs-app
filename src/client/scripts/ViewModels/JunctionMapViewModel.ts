﻿/// <reference path="../tsdef/jquery.d.ts"/>
/// <reference path="../tsdef/knockout-3.3.d.ts"/>
/// <reference path="../tsdef/google.maps.d.ts"/>
/// <reference path="../stopbystop-interfaces.ts"/>
/// <reference path="JunctionViewModel.ts"/>

"use strict";
module StopByStop {
    export class JunctionMapViewModel {
        private mapDiv: Element;
        private mapContainerDiv: Element;
        private junction: RouteJunctionViewModel;
        private poiInfoWindow: google.maps.InfoWindow;
        private map: google.maps.Map;
        private urls: IInitUrls;

        constructor(mapDiv: Element, mapContainerDiv: Element, junction: RouteJunctionViewModel, urls: IInitUrls) {

            this.junction = junction;
            this.mapDiv = mapDiv;
            this.mapContainerDiv = mapContainerDiv;
            this.urls = urls;

            if (this.mapDiv && this.mapContainerDiv) {
                window.setTimeout(() => {
                    $(this.mapDiv).css({ 'height': $(this.mapDiv).width() + 'px' });

                    this.onMapReady();

                    window.setTimeout(() => {
                        $(this.mapContainerDiv).hide();
                    }, 500);
                }, 300);
            }

        }

        private onMapReady(): void {
            var junctionPoint = new google.maps.LatLng(this.junction.junction.location.lat, this.junction.junction.location.lon);
            this.map = new google.maps.Map(this.mapDiv,
                {
                    zoom: 14,
                    center: junctionPoint,
                    disableDefaultUI: false
                });

            var junctionMarker = new google.maps.Marker({
                position: junctionPoint,
                map: this.map,
                icon: this.urls.MapExitIconUrl
            });

            window["map"] = this.map;
            this.createPois();
        };

        private createPois(): void {

            var pois = this.junction.junction.pois();


            $.each(pois, (indexInArray: any, valueOfElement: any) => {
                var poi = <PoiOnJunctionViewModel>valueOfElement;
                var poiPoint = new google.maps.LatLng(poi.poi.location.lat, poi.poi.location.lon);

                var poiMarker = new google.maps.Marker(
                    {
                        position: poiPoint,
                        icon: poi.poi.poiType === PoiType.Food ? this.urls.MapFoodIconUrl : this.urls.MapGasIconUrl,
                        map: this.map
                    });

                poiMarker.setVisible(poi.poi.visible());


                poiMarker.addListener('click', () => {
                    if (this.poiInfoWindow) {
                        this.poiInfoWindow.close();
                    }

                    ko.cleanNode($("#poiPopupTemplate")[0]);
                    ko.applyBindings(poi, $("#poiPopupTemplate")[0]);


                    if (!poiMarker["iw"]) {
                        var gmapsInfoWindow = new google.maps.InfoWindow({
                            content: $("#poiPopupTemplate").html()
                        });
                        poiMarker["iw"] = gmapsInfoWindow;


                        poi.poi.isYInfoLoading.subscribe(() => {
                            ko.cleanNode($("#poiPopupTemplate")[0]);
                            ko.applyBindings(poi, $("#poiPopupTemplate")[0]);
                            gmapsInfoWindow.setContent($("#poiPopupTemplate").html());
                        });
                    }

                    this.poiInfoWindow = (<google.maps.InfoWindow>poiMarker["iw"]);
                    (<any>window).showPoiOptionsForMapPopup = () => {
                        poi.addToRouteOptionsClick();
                    };
                    this.poiInfoWindow.open(this.map, poiMarker);

                });
                poi.poi.visible.subscribe((newValue) => {
                    poiMarker.setVisible(newValue);
                    if (!newValue && poiMarker["iw"]) {
                        (<google.maps.InfoWindow>poiMarker["iw"]).close();
                    }
                });
            });
        };
    }
}