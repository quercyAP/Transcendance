FROM debian:bullseye


RUN apt-get update -y && apt-get upgrade -y && apt-get install -y nginx openssl

RUN mkdir -p /etc/nginx/ssl

RUN openssl req -x509 -nodes -out /etc/nginx/ssl/inception.crt -keyout /etc/nginx/ssl/inception.key -subj "/C=FR/ST=Alsace/L=Mulhouse/O=42/OU=42Mulhouse/CN=tdechand.42.fr/UID=tdechand"

RUN mkdir -p /var/run/nginx

RUN rm -Rf /etc/nginx/sites-enabled

COPY nginx.conf /etc/nginx/nginx.conf

RUN chmod 755 /var/www/html

RUN chown -R www-data:www-data /var/www/html

CMD ["nginx", "-g", "daemon off;"]
