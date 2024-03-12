RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[0;33m
BLUE=\033[0;34m
MAGENTA=\033[0;35m
CYAN=\033[0;36m
RESET=\033[0m


all:	set-ip
		docker-compose up --build -d

fclean: clean
		docker rmi -f $$(docker images -q)
		docker image prune -a -f
		docker system prune -a -f

clean:	
		docker-compose down -v 

stop:	
		docker-compose down -v

start:	set-ip
		docker-compose up -d

set-ip:
	@echo "$(BLUE)Entrez une adresse IP(ou localhost pour du local): $(RESET)"; \
	read ip_address; \
	full_address="http://$$ip_address:4001"; \
	if [ -f .env ]; then \
		if grep -q 'REVERSE_PROXY_URL=' .env; then \
			sed -i 's|REVERSE_PROXY_URL=.*|REVERSE_PROXY_URL='"$$full_address"'|' .env; \
		else \
			echo 'REVERSE_PROXY_URL='"$$full_address"'' >> .env; \
		fi \
	else \
		echo 'REVERSE_PROXY_URL='"$$full_address"'' > .env; \
	fi

get-ip:
	@OS=$$(uname); \
	echo "$(BLUE)Système d'exploitation: $(YELLOW)$$OS$(RESET)"; \
	case $$OS in \
	  Linux) IP_ADDRESS=$$(hostname -I | awk '{print $$1}') ;; \
	  Darwin) IP_ADDRESS=$$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $$2}') ;; \
	  CYGWIN*|MINGW32*|MSYS*|MINGW*) IP_ADDRESS=$$(ipconfig | grep "IPv4 Address" | awk '{print $$NF}') ;; \
	  *) echo "Système d'exploitation non pris en charge." ; exit 1 ;; \
	esac; \
	echo "$(BLUE)Adresse IP: $(YELLOW)$$IP_ADDRESS$(RESET)"

re:	fclean all

