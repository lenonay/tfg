#!/bin/bash
#Comprobación de usuario root
if [ "$EUID" -ne 0 ]; then
    echo "Este script debe ejecutarse como root"
    exit 1
fi
# Comprobamos el parámetro de la acción a realizar pasado por CLI, asi como la IP
if [ $# -lt 1 ]; then
    echo "Uso: $0 [block|unblock|status|campus-block|campus-unblock|campus-status] [IP]"
    exit 1
fi

ACTION=$1
DOMINIO_CAMPUS="www3.gobiernodecanarias.org"
#Obtenemos las IPs del campus para que se permitan con el campus block
resolver_ips() {
    dig +short "$DOMINIO_CAMPUS" A | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
}
#Con un case realizamos comprobación de la validez de los parámetros pasados
case $ACTION in
    block|unblock|status|campus-block|campus-unblock|campus-status)
        if [[ $# -ne 2 ]]; then
            echo "Uso: $0 $ACTION [IP]"
            exit 1
        fi

        IP=$2
        if ! [[ $IP =~ ^[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]]; then
            echo "Error: La dirección IP proporcionada no es válida"
            exit 1
        fi
        ;;
    *)
        echo "Acción no válida: $ACTION"
        exit 1
        ;;
esac
#Función para guardar las reglas de iptables cada vez que se bloquee o desbloquee
guardar_reglas() {
    iptables-save > /etc/iptables/rules.v4
    echo "Reglas guardadas"
}

#Funcion para eliminar las reglas aplicadas con campus-block
eliminar_reglas_campus() {
    local ip=$1

    # Eliminar TODAS las reglas en FORWARD que tengan "-s IP"
    iptables-save | grep "\-A FORWARD" | grep "\-s $ip" | while read -r regla; do
        regla_del=$(echo "$regla" | sed "s/^-A /-D /")
        iptables $regla_del 2>/dev/null
    done
}
#Case para las diferentes acciones que se pueden realizar
case $ACTION in
    block)
        if ! iptables -C FORWARD -s $IP -j DROP 2>/dev/null; then
            iptables -I FORWARD -s $IP -j DROP 
            iptables -I FORWARD -s $IP -p icmp -j ACCEPT
            echo "Bloqueo activado para $IP"
            guardar_reglas
        else
            echo "La IP $IP ya está bloqueada"
        fi
        ;;
    unblock)
        eliminar_reglas_campus $IP
        echo "Bloqueo eliminado para $IP"
        guardar_reglas
        ;;
    status)
        if iptables -C FORWARD -s $IP -j DROP 2>/dev/null; then
            echo "Estado: $IP está bloqueada"
        else
            echo "Estado: $IP no está bloqueada"
        fi
        ;;
    campus-block)
        echo "Resolviendo IPs para $DOMINIO_CAMPUS..."
        IPS=$(resolver_ips)

        if [ -z "$IPS" ]; then
            echo "Error: No se pudieron resolver las IPs del campus"
            exit 1
        fi

        eliminar_reglas_campus $IP

		iptables -I FORWARD -s $IP -j DROP
        # Permitir ICMP
        iptables -I FORWARD -s $IP -p icmp -j ACCEPT

        # Permitir DNS (UDP y TCP)
        iptables -I FORWARD -s $IP -p udp --dport 53 -j ACCEPT

        # Permitir acceso a las IPs del campus
        for campus_ip in $IPS; do
            iptables -I FORWARD -s $IP -d $campus_ip -j ACCEPT
        done

      
        echo "Modo campus activado para $IP"
        guardar_reglas
        ;;
    campus-unblock)
        eliminar_reglas_campus $IP
        echo "Modo campus desactivado para $IP"
        guardar_reglas
        ;;
    campus-status)
        if iptables -C FORWARD -s $IP -j DROP 2>/dev/null; then
            echo "Modo campus activado para $IP"
            iptables -S FORWARD | grep "\-s $IP" | grep "\-d" | awk '{for(i=1;i<=NF;i++) if ($i=="-d") print $(i+1)}'
        else
            echo "Modo campus no activado para $IP"
        fi
        ;;
esac

exit 0
